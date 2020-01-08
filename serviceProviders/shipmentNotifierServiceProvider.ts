import { ConnectionServiceProvider } from "../micro-node";
import { NotificationSubscriber } from "./notificationSubscriberServiceProvider";
import { SendFunction } from "../micro-node/Connection";
import { DB } from "./databaseServiceProvider";

export const shipmentNotifierServiceProvider = new ConnectionServiceProvider<
    ShipmentNotifier
>(
    "shipmentNotifier",
    ["notificationSubscriber", "handleClose", "send"],
    (getGlobalServicePayload, getConnectionServicePayload) => {
        const notifications = getConnectionServicePayload<
            NotificationSubscriber
        >("notificationSubscriber");
        const db = getGlobalServicePayload<DB>("db");

        const subscribeToAllocation = (
            shipmentId: number,
            purchaseOrderProductId: number,
            tag: string
        ) => {
            notifications.subscribe(
                `shipments:${shipmentId}`,
                () => {
                    db.query(
                        `SELECT b.id,
                                        b.index,
                                        COALESCE(popb.quantity, 0)                           product_quantity,
                                        COALESCE(popb.quantity, 0) = box_quantities.quantity otherwise_empty
                                 FROM packing_tool.shipments s
                                          LEFT JOIN packing_tool.boxes b ON s.id = b.shipment_id
                                          LEFT OUTER JOIN (SELECT pop.id,
                                                                  popb.box_id,
                                                                  popb.quantity
                                                           FROM packing_tool.purchase_order_products pop
                                                                    LEFT JOIN packing_tool.purchase_order_product_boxes popb
                                                                              ON pop.id = popb.purchase_order_product_id
                                                           WHERE pop.id = :purchaseOrderProductId) popb
                                                          ON b.id = popb.box_id
                                          LEFT JOIN (SELECT b.id,
                                                            COALESCE(SUM(popb.quantity), 0) quantity
                                                     FROM packing_tool.boxes b
                                                              LEFT JOIN packing_tool.purchase_order_product_boxes popb
                                                                        ON b.id = popb.box_id
                                                     WHERE b.shipment_id = :shipmentId
                                                     GROUP BY b.id
                                 ) box_quantities ON b.id = box_quantities.id
                                 WHERE s.id = :shipmentId;`,
                        {
                            shipmentId,
                            purchaseOrderProductId
                        }
                    ).then(boxes => {
                        getConnectionServicePayload<SendFunction>("send")(
                            "shipments/allocate/update",
                            boxes,
                            tag
                        );
                    });
                },
                true
            );
        };

        const updateAllocated = (
            shipmentId: number,
            purchaseOrderProductId: number
        ) => {
            db.execute(
                `UPDATE packing_tool.purchase_order_products pop
                    LEFT JOIN (SELECT pop.id,
                                      SUM(popb.quantity) as allocated_quantity
                               FROM packing_tool.purchase_order_products as pop
                                        LEFT OUTER JOIN packing_tool.purchase_order_product_boxes as popb
                                                        ON popb.purchase_order_product_id = pop.id
                                        LEFT JOIN packing_tool.boxes b ON b.id = popb.box_id
                                        LEFT JOIN packing_tool.shipments s ON s.id = b.shipment_id
                               WHERE pop.id = :purchaseOrderProductId AND s.open
                               GROUP BY pop.id) sums ON sums.id = pop.id
                 SET pop.allocated_quantity = IF(sums.allocated_quantity IS NULL, 0, sums.allocated_quantity)
                 WHERE pop.id = :purchaseOrderProductId;`,
                { shipmentId, purchaseOrderProductId }
            ).then(() => {
                notifications.notify(`shipments:${shipmentId}`);
            });
        };

        const subscribeToShipment = (shipmentId: number, tag: string) => {
            notifications.subscribe(
                `shipments:${shipmentId}`,
                () => {
                    db.query(
                        `SELECT b.id,
                                     b.\`index\`,
                                     pop.id                     purchase_order_product_id,
                                     pop.sku,
                                     pop.purchase_order_id,
                                     pop.profit * popb.quantity profit,
                                     pop.weight * popb.quantity weight,
                                     popb.quantity
                              FROM packing_tool.boxes b
                                       LEFT JOIN packing_tool.purchase_order_product_boxes popb on b.id = popb.box_id
                                       LEFT JOIN packing_tool.purchase_order_products pop
                                                 on popb.purchase_order_product_id = pop.id
                              WHERE b.shipment_id = :shipmentId`,
                        {
                            shipmentId
                        }
                    ).then(boxes => {
                        getConnectionServicePayload<SendFunction>("send")(
                            "shipments/update",
                            boxes.reduce((boxes, box) => {
                                let existingBox = boxes.find(
                                    candidateBox => box.id === candidateBox.id
                                );
                                if (!existingBox) {
                                    existingBox = {
                                        id: box.id,
                                        index: box.index,
                                        purchaseOrderProducts: []
                                    };
                                    boxes.push(existingBox);
                                }
                                if (box.purchaseOrderProductId) {
                                    existingBox.purchaseOrderProducts.push({
                                        id: box.purchaseOrderProductId,
                                        sku: box.sku,
                                        purchaseOrderId: box.purchaseOrderId,
                                        profit: box.profit,
                                        weight: box.weight,
                                        quantity: box.quantity
                                    });
                                }
                                return boxes;
                            }, []),
                            tag
                        );
                    });
                },
                true
            );
        };

        const updateShipped = (shipmentId: number) => {
            Promise.all([
                db.execute(
                    `UPDATE packing_tool.purchase_order_products pop
                    LEFT JOIN (SELECT pop.id,
                                      SUM(popb.quantity) as allocated_quantity
                               FROM packing_tool.purchase_order_products as pop
                                        LEFT OUTER JOIN packing_tool.purchase_order_product_boxes as popb
                                                        ON popb.purchase_order_product_id = pop.id
                                        LEFT JOIN packing_tool.boxes b ON b.id = popb.box_id
                                        LEFT JOIN packing_tool.shipments s ON s.id = b.shipment_id
                               WHERE NOT s.open
                               GROUP BY pop.id) sums ON sums.id = pop.id
                 SET pop.shipped_quantity = COALESCE(sums.allocated_quantity, 0)`
                ),
                db.execute(
                    `UPDATE packing_tool.purchase_order_products pop
                    LEFT JOIN (SELECT pop.id,
                                      SUM(popb.quantity) as allocated_quantity
                               FROM packing_tool.purchase_order_products as pop
                                        LEFT OUTER JOIN packing_tool.purchase_order_product_boxes as popb
                                                        ON popb.purchase_order_product_id = pop.id
                                        LEFT JOIN packing_tool.boxes b ON b.id = popb.box_id
                                        LEFT JOIN packing_tool.shipments s ON s.id = b.shipment_id
                               WHERE s.id = :shipmentId AND s.open
                               GROUP BY pop.id) sums ON sums.id = pop.id
                 SET pop.allocated_quantity = IF(sums.allocated_quantity IS NULL, 0, sums.allocated_quantity)`,
                    { shipmentId }
                )
            ]).then(() => {
                notifications.notify(`shipments:${shipmentId}`);
            });
        };

        return Promise.resolve({
            subscribeToAllocation,
            updateAllocated,
            subscribeToShipment,
            updateShipped
        });
    }
);

export interface ShipmentNotifier {
    subscribeToAllocation: (
        shipmentId: number,
        purchaseOrderProductId: number,
        tag: string
    ) => void;
    subscribeToShipment: (shipmentId: number, tag: string) => void;
    updateAllocated: (
        shipmentId: number,
        purchaseOrderProductId: number
    ) => void;
    updateShipped: (shipmentId: number) => void;
}

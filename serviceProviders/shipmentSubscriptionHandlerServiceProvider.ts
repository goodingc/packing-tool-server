import { GlobalServiceProvider } from "../micro-node";
import { connection as WebSocketConnection } from "websocket";
import { DB } from "./databaseServiceProvider";

export const shipmentSubscriptionHandlerServiceProvider = new GlobalServiceProvider<
    ShipmentSubscriptionHandler
>("shipmentSubscriptionHandler", ["db"], getGlobalServicePayload => {
    let shipmentSubscriptions: ShipmentSubscription[] = [];

    const subscribe = (
        shipmentSubscription: ShipmentSubscription
    ): VoidFunction => {
        shipmentSubscriptions.push(shipmentSubscription);
        updateSubscription(shipmentSubscription);
        return () => {
            shipmentSubscriptions = shipmentSubscriptions.filter(
                (candidateSubscription: ShipmentSubscription) => {
                    return (
                        candidateSubscription.purchaseOrderProductId !==
                            shipmentSubscription.purchaseOrderProductId &&
                        candidateSubscription.shipmentId !==
                            shipmentSubscription.shipmentId
                    );
                }
            );
        };
    };

    const db = getGlobalServicePayload<DB>("db");

    const updateSubscription = (subscription: ShipmentSubscription) => {
        db.query(
            `SELECT b.id,
                        b.index,
                        COALESCE(popb.quantity, 0)                           product_quantity,
                        COALESCE(popb.quantity, 0) = box_quantities.quantity otherwise_empty
                 FROM shipments s
                          LEFT JOIN boxes b ON s.id = b.shipment_id
                          LEFT OUTER JOIN (SELECT pop.id,
                                                  popb.box_id,
                                                  popb.quantity
                                           FROM purchase_order_products pop
                                                    LEFT JOIN purchase_order_product_boxes popb
                                                              ON pop.id = popb.purchase_order_product_id
                                           WHERE pop.id = :purchaseOrderProductId) popb
                                          ON b.id = popb.box_id
                          LEFT JOIN (SELECT b.id,
                                            COALESCE(SUM(popb.quantity), 0) quantity
                                     FROM boxes b
                                              LEFT JOIN purchase_order_product_boxes popb
                                                        ON b.id = popb.box_id
                                     WHERE b.shipment_id = :shipmentId
                                     GROUP BY b.id
                 ) box_quantities ON b.id = box_quantities.id
                 WHERE s.id = :shipmentId;`,
            subscription
        ).then(subscription.update);
    };

    const sendUpdate = ({ shipmentId, purchaseOrderProductId }) => {
        db.execute(
            `UPDATE purchase_order_products pop
                    LEFT JOIN (SELECT pop.id,
                                      SUM(popb.quantity) as allocated_quantity
                               FROM packing_tool_backup.purchase_order_products as pop
                                        LEFT OUTER JOIN packing_tool_backup.purchase_order_product_boxes as popb
                                                        ON popb.purchase_order_product_id = pop.id
                               WHERE pop.id = :purchaseOrderProductId
                               GROUP BY pop.id) sums ON sums.id = pop.id
                 SET pop.allocated_quantity = IF(sums.allocated_quantity IS NULL, 0, sums.allocated_quantity)
                 WHERE pop.id = :purchaseOrderProductId;`,
            { shipmentId, purchaseOrderProductId }
        );
        shipmentSubscriptions.forEach(subscription => {
            if (subscription.shipmentId === shipmentId) {
                updateSubscription(subscription);
            }
        });
    };

    return Promise.resolve({
        sendUpdate,
        subscribe
    });
});

export interface ShipmentSubscriptionHandler {
    subscribe: (shipmentSubscription: ShipmentSubscription) => VoidFunction;
    sendUpdate: (shipmentSubscription: ShipmentSubscription) => void;
}

export interface ShipmentSubscription {
    shipmentId: number;
    purchaseOrderProductId: number;
    update: (data: any) => void;
}

import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../serviceProviders/databaseServiceProvider";
import { ShipmentNotifier } from "../../serviceProviders/shipmentNotifierServiceProvider";

export const addShipmentBoxesAction = new Action(
    "shipments/addBoxes",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        const db = getGlobalServicePayload<DB>("db");
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "shipmentId",
                "boxQuantity",
                "purchaseOrderProductId",
                "boxAmount"
            ).then(
                ([
                    shipmentId,
                    boxQuantity,
                    purchaseOrderProductId,
                    boxAmount
                ]) => {
                    return db
                        .query(
                            `SELECT COUNT(b.id) box_count
                                 FROM packing_tool.boxes b
                                 WHERE shipment_id = :shipmentId
                                 GROUP BY b.shipment_id;`,
                            {
                                shipmentId
                            }
                        )
                        .then(([{ boxCount }]) => {
                            return db
                                .execute(
                                    [...Array(boxAmount).keys()]
                                        .reduce(
                                            (statement, i) => {
                                                return (
                                                    statement +
                                                    `(:firstIndex + ${i}, :shipmentId), `
                                                );
                                            },
                                            `INSERT INTO boxes (\`index\`, shipment_id)
                                                 VALUES `
                                        )
                                        .slice(0, -2) + `;`,
                                    {
                                        shipmentId,
                                        firstIndex: boxCount
                                    }
                                )
                                .then(() => {
                                    if (boxQuantity > 0) {
                                        return db
                                            .query(
                                                `SELECT id
                                                     FROM packing_tool.boxes
                                                     WHERE shipment_id = :shipmentId
                                                       AND \`index\` BETWEEN :lowerIndex AND :upperIndex`,
                                                {
                                                    shipmentId,
                                                    lowerIndex: boxCount,
                                                    upperIndex:
                                                        boxCount + boxAmount - 1
                                                }
                                            )
                                            .then(boxes => {
                                                return db.execute(
                                                    boxes
                                                        .reduce(
                                                            (
                                                                statement,
                                                                { id }
                                                            ) => {
                                                                return (
                                                                    statement +
                                                                    `(${id}, :purchaseOrderProductId, :boxQuantity), `
                                                                );
                                                            },
                                                            `INSERT INTO packing_tool.purchase_order_product_boxes (box_id, purchase_order_product_id, quantity)
                                                                 VALUES `
                                                        )
                                                        .slice(0, -2) + `;`,
                                                    {
                                                        purchaseOrderProductId,
                                                        boxQuantity
                                                    }
                                                );
                                            });
                                    }
                                });
                        })
                        .then(() => {
                            getConnectionServicePayload<ShipmentNotifier>(
                                "shipmentNotifier"
                            ).updateAllocated(
                                shipmentId,
                                purchaseOrderProductId
                            );
                        });
                }
            )
        );
    }
);

import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { RequireInputsFunction } from "../../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../../serviceProviders/databaseServiceProvider";
import { NotificationSubscriber } from "../../../serviceProviders/notificationSubscriberServiceProvider";

export const clearEmptyShipmentBoxesAction = new Action(
    "shipments/boxes/clearEmptyTrailing",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "shipmentId"
            ).then(([shipmentId]) => {
                const db = getGlobalServicePayload<DB>("db");
                const recurse = () => {
                    return db
                        .query(
                            `SELECT *
                                 FROM packing_tool.boxes b
                                 WHERE b.index = (SELECT MAX(b.index)
                                                  FROM packing_tool.boxes b
                                                  WHERE b.shipment_id = :shipmentId)
                                   AND b.shipment_id = :shipmentId
                            `,
                            {
                                shipmentId
                            }
                        )
                        .then(([trailingBox]) => {
                            return db
                                .query(
                                    `SELECT *
                                         FROM packing_tool.purchase_order_product_boxes
                                         WHERE box_id = :id
                                    `,
                                    trailingBox
                                )
                                .then(boxes => {
                                    if (boxes.length === 0) {
                                        return db
                                            .execute(
                                                `DELETE
                                                     FROM packing_tool.boxes
                                                     WHERE id = :id`,
                                                trailingBox
                                            )
                                            .then(() => {
                                                return recurse();
                                            });
                                    }
                                });
                        });
                };
                return recurse().then(() => {
                    getConnectionServicePayload<NotificationSubscriber>(
                        "notificationSubscriber"
                    ).notify(`shipments:${shipmentId}`);
                });
            })
        );
    }
);

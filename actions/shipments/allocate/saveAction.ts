import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { RequireInputsFunction } from "../../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../../serviceProviders/databaseServiceProvider";
import { ShipmentSubscriber } from "../../../serviceProviders/shipmentSubscriberServiceProvider";

export const saveAllocationAction = new Action(
    "shipments/allocate/save",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "purchaseOrderProductId",
                "boxes"
            )
                .then(([purchaseOrderProductId, boxes]) => {
                    const db = getGlobalServicePayload<DB>("db");
                    return db
                        .execute(
                            boxes
                                .reduce(
                                    (statement, { id, quantity }) => {
                                        return (
                                            statement +
                                            `(${id}, :purchaseOrderProductId, ${quantity}), `
                                        );
                                    },
                                    `REPLACE INTO purchase_order_product_boxes (box_id, purchase_order_product_id, quantity)
                                                                     VALUES `
                                )
                                .slice(0, -2) + `;`,
                            {
                                purchaseOrderProductId
                            }
                        )
                        .then(() => {
                            return db.execute(
                                `DELETE FROM purchase_order_product_boxes WHERE quantity = 0`
                            );
                        });
                })
                .then(() => {
                    getConnectionServicePayload<ShipmentSubscriber>(
                        "shipmentSubscriber"
                    ).sendUpdate();
                })
        );
    }
);

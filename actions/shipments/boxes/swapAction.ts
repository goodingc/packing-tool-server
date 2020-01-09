import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { RequireInputsFunction } from "../../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../../serviceProviders/databaseServiceProvider";
import { NotificationSubscriber } from "../../../serviceProviders/notificationSubscriberServiceProvider";

export const swapShipmentBoxesAction = new Action(
    "shipments/boxes/swap",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "id"
            ).then(([id]) => {
                const db = getGlobalServicePayload<DB>("db");
                return db
                    .query(
                        `SELECT *
                             FROM packing_tool.boxes b
                             WHERE b.id = :id`,
                        {
                            id
                        }
                    )
                    .then(([oldBox]) => {
                        return db
                            .query(
                                `SELECT MAX(\`index\`) trailingIndex
                                     FROM packing_tool.boxes
                                     WHERE shipment_id = :shipmentId`,
                                oldBox
                            )
                            .then(([{ trailingIndex }]) => {
                                console.log({
                                    index: oldBox.index,
                                    trailingIndex,
                                    shipmentId: oldBox.shipmentId
                                });
                                return db.execute(
                                    `UPDATE packing_tool.boxes b
                                         SET b.index = :index
                                         WHERE b.index = :trailingIndex
                                           AND b.shipment_id = :shipmentId`,
                                    {
                                        index: oldBox.index,
                                        trailingIndex,
                                        shipmentId: oldBox.shipmentId
                                    }
                                );
                            })
                            .then(() => {
                                return db.execute(
                                    `DELETE
                                         FROM packing_tool.boxes b
                                         WHERE b.id = :id`,
                                    oldBox
                                );
                            })
                            .then(() => {
                                getConnectionServicePayload<
                                    NotificationSubscriber
                                >("notificationSubscriber").notify(
                                    `shipments:${oldBox.shipmentId}`
                                );
                            });
                    });
            })
        );
    }
);

import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../serviceProviders/databaseServiceProvider";
import { ShipmentNotifier } from "../../serviceProviders/shipmentNotifierServiceProvider";

export const closeShipmentAction = new Action(
    "shipments/close",
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
                return db
                    .query(
                        `SELECT *
                             FROM packing_tool.shipments s
                             WHERE s.id = :shipmentId`,
                        {
                            shipmentId
                        }
                    )
                    .then(([shipment]) => {
                        return Promise.all([
                            db.execute(
                                `UPDATE packing_tool.shipments s
                                     SET s.open = FALSE
                                     WHERE s.id = :id`,
                                shipment
                            ),
                            db.execute(
                                `INSERT INTO packing_tool.shipments (packing_tool.shipments.fulfillment_center_id)
                                     VALUES (:fulfillmentCenterId)`,
                                shipment
                            )
                        ]);
                    })
                    .then(() => {
                        return db
                            .query(
                                `SELECT *
                                     FROM packing_tool.shipments s
                                     WHERE s.id = LAST_INSERT_ID()`
                            )
                            .then(([newShipment]) => {
                                return Promise.all([
                                    db.execute(
                                        `UPDATE packing_tool.fulfillment_centers fc
                                             SET fc.active_shipment_id = :id
                                             WHERE fc.id = :fulfillmentCenterId`,
                                        newShipment
                                    ),
                                    db.execute(
                                        `INSERT INTO packing_tool.boxes (\`index\`, shipment_id)
                                             VALUES (0, :id)`,
                                        newShipment
                                    )
                                ]).then(() => {
                                    getConnectionServicePayload<
                                        ShipmentNotifier
                                    >("shipmentNotifier").updateShipped(
                                        shipmentId
                                    );
                                    return newShipment;
                                });
                            });
                    });
            })
        );
    }
);

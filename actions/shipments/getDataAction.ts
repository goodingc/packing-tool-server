import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { DB } from "../../serviceProviders/databaseServiceProvider";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { ShipmentNotifier } from "../../serviceProviders/shipmentNotifierServiceProvider";

export const getShipmentDataAction = new Action(
    "shipments/getData",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        const db = getGlobalServicePayload<DB>("db");
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "shipmentId"
            ).then(([shipmentId]) => {
                getConnectionServicePayload<ShipmentNotifier>(
                    "shipmentNotifier"
                ).subscribeToShipment(
                    shipmentId,
                    getMessageServicePayload<string>("tag")
                );
                return db.query(
                    `SELECT s.id, s.fulfillment_center_id, s.id = fc.active_shipment_id active, s.open
                             FROM packing_tool.shipments s
                                      LEFT JOIN packing_tool.fulfillment_centers fc ON s.fulfillment_center_id = fc.id
                             WHERE s.id = :shipmentId`,
                    {
                        shipmentId
                    }
                );
            })
        );
    }
);

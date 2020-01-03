import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const getAllShipmentsAction = new Action(
    "shipments/getAll",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db")
                .query(`SELECT s.id, s.fulfillment_center_id, s.open, s.invoiced, s.id = fc.active_shipment_id active
                        FROM packing_tool.shipments s
                                 LEFT JOIN packing_tool.fulfillment_centers fc on s.fulfillment_center_id = fc.id`)
        );
    }
);

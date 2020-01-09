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
            getGlobalServicePayload<DB>("db").query(`SELECT s.id,
                                                            s.fulfillment_center_id,
                                                            s.open,
                                                            s.invoiced,
                                                            s.id = fc.active_shipment_id active,
                                                            box_counts.\`count\`         box_count
                                                     FROM packing_tool.shipments s
                                                              LEFT JOIN packing_tool.fulfillment_centers fc on s.fulfillment_center_id = fc.id
                                                              LEFT JOIN (
                                                         SELECT s.id, COUNT(b.id) \`count\`
                                                         FROM packing_tool.shipments s
                                                                  LEFT JOIN packing_tool.boxes b ON s.id = b.shipment_id
                                                         GROUP BY s.id
                                                     ) box_counts ON box_counts.id = s.id
            `)
        );
    }
);

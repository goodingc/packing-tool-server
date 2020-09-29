import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { DB } from "../../../serviceProviders/databaseServiceProvider";

export const getFulfillmentCentersAction = new Action(
    "importPurchaseOrders/v2/getFulfillmentCenters",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db")
                .query(`SELECT id FROM fulfillment_centers WHERE placeholder;`)
                .then(results => results.map(row => row.id))
        );
    }
);

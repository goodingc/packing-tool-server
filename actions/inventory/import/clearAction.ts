import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { DB } from "../../../serviceProviders/databaseServiceProvider";

export const clearInventoryAction = new Action(
    "inventory/import/clear",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db").execute(
                `DELETE FROM packing_tool.products`
            )
        );
    }
);

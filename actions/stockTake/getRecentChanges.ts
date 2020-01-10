import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const getStockTakeRecentChangesAction = new Action(
    "stockTake/getRecentChanges",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db").query(
                    `SELECT stq.*, p.title
                     FROM packing_tool.stock_take_queue stq
                              LEFT JOIN packing_tool.products p on stq.sku = p.sku
                     ORDER BY id DESC
                     LIMIT 10`
            )
        );
    }
);

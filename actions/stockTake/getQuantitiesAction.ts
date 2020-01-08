import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const getStockTakeQuantitiesAction = new Action(
    "stockTake/getQuantities",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db")
                .query(`SELECT bay, sku, SUM(quantity_change) quantity
                                                     FROM packing_tool.stock_take_queue
                                                     GROUP BY sku, bay`)
        );
    }
);

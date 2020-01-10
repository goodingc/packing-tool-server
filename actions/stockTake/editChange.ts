import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const stockTakeEditChangeAction = new Action(
    "stockTake/editChange",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "id",
                "bay",
                "quantityChange"
            ).then(([id, bay, quantityChange]) => {
                return getGlobalServicePayload<DB>("db").execute(
                    `UPDATE packing_tool.stock_take_queue SET bay = :bay, quantity_change = :quantityChange WHERE id = :id`,
                    {
                        id,
                        bay,
                        quantityChange
                    }
                );
            })
        );
    }
);

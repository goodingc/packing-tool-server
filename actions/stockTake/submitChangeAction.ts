import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const stockTakeSubmitChangeAction = new Action(
    "stockTake/submitChange",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "bay",
                "sku",
                "quantityChange"
            ).then(([bay, sku, quantityChange]) => {
                return getGlobalServicePayload<DB>("db").execute(
                    `INSERT INTO packing_tool.stock_take_queue (sku, bay, quantity_change)
                         VALUES (:sku, :bay, :quantityChange)`,
                    {
                        sku,
                        bay,
                        quantityChange
                    }
                );
            })
        );
    }
);

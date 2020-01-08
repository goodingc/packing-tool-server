import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const stockTakeProductSearchAction = new Action(
    "stockTake/productSearch",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "query"
            ).then(([query]) => {
                const db = getGlobalServicePayload<DB>("db");
                return db.query(
                    `SELECT *
                                 FROM packing_tool.products
                                 WHERE ean = :query
                                    OR LOWER(sku) = :query
                                    OR LOWER(title) = :query`,
                    {
                        query: query.toLowerCase()
                    }
                );
            })
        );
    }
);

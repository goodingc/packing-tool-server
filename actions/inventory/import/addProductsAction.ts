import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { RequireInputsFunction } from "../../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../../serviceProviders/databaseServiceProvider";
import { format } from "mysql2";

export const addInventoryProductsAction = new Action(
    "inventory/import/addProducts",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "products"
            ).then(([products]) => {
                const db = getGlobalServicePayload<DB>("db");
                return db.execute(
                    format(
                        `INSERT INTO packing_tool.products (sku, title, ean, stock_level, stock_locations)
                                 VALUES ?`,
                        [
                            products.map(
                                ({
                                    sku,
                                    title,
                                    ean,
                                    stockLevel,
                                    stockLocations
                                }) => {
                                    return [
                                        sku,
                                        title,
                                        ean,
                                        stockLevel,
                                        stockLocations
                                    ];
                                }
                            )
                        ]
                    )
                );
            })
        );
    }
);

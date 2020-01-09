import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const addPurchaseOrderAction = new Action(
    "importPurchaseOrders/addPurchaseOrder",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "id",
                "fulfillmentCenterId",
                "vendorCode",
                "deliveryWindowStart",
                "deliveryWindowEnd",
                "products"
            ).then(
                ([
                    id,
                    fulfillmentCenterId,
                    vendorCode,
                    deliveryWindowStart,
                    deliveryWindowEnd,
                    products
                ]) => {
                    const db = getGlobalServicePayload<DB>("db");
                    return db
                        .execute(
                            `INSERT INTO packing_tool.purchase_orders (id, fulfillment_center_id, vendor_code,
                                                                           delivery_window_start,
                                                                           delivery_window_end)
                                 VALUES (:id, :fulfillmentCenterId, :vendorCode, :deliveryWindowStart,
                                         :deliveryWindowEnd)`,
                            {
                                id,
                                fulfillmentCenterId,
                                vendorCode,
                                deliveryWindowStart,
                                deliveryWindowEnd
                            }
                        )
                        .then(() => {
                            return Promise.all(
                                products.map(product => {
                                    return db.execute(
                                        `INSERT INTO packing_tool.purchase_order_products (purchase_order_id,
                                                                                                 sku, order_quantity,
                                                                                                 accepted_quantity,
                                                                                                 title, asin,
                                                                                                 prep_required,
                                                                                                 weight, ean,
                                                                                                 sell_price, unit_cost,
                                                                                                 shipping_cost,
                                                                                                 overhead_cost, vat,
                                                                                                 including_vat_fee,
                                                                                                 excluding_vat_fee,
                                                                                                 other_fee, profit)
                                               VALUES (:purchaseOrderId, :sku, :orderedQuantity, :acceptedQuantity,
                                                       :title, :asin, :prepRequired, :weight, :ean, :sellPrice,
                                                       :unitCost, :shippingCost, :overheadCost, :vat, :includingVatFee,
                                                       :excludingVatFee, :otherFee, :profit)`,
                                        Object.assign(
                                            { purchaseOrderId: id },
                                            product
                                        )
                                    );
                                })
                            );
                        });
                }
            )
        );
    }
);

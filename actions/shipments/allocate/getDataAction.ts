import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { DB } from "../../../serviceProviders/databaseServiceProvider";
import { RequireInputsFunction } from "../../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import { ShipmentSubscriber } from "../../../serviceProviders/shipmentSubscriberServiceProvider";

export const getShipmentAllocationDataAction = new Action(
    "shipments/allocate/getData",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        const db = getGlobalServicePayload<DB>("db");
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "shipmentId",
                "purchaseOrderProductId"
            )
                .then(([shipmentId, purchaseOrderProductId]) => {
                    getConnectionServicePayload<ShipmentSubscriber>(
                        "shipmentSubscriber"
                    ).subscribe(
                        shipmentId,
                        purchaseOrderProductId,
                        getMessageServicePayload<string>("tag")
                    );
                    return Promise.all([
                        db.query(
                            `
                                    SELECT s.id, s.fulfillment_center_id
                                    FROM shipments s
                                    WHERE s.id = :shipmentId
                            `,
                            {
                                shipmentId
                            }
                        ),
                        db.query(
                            `
                                    SELECT pop.id,
                                           pop.title,
                                           pop.purchase_order_id,
                                           pop.accepted_quantity,
                                           pop.allocated_quantity,
                                           pop.sku
                                    FROM purchase_order_products pop
                                    WHERE pop.id = :purchaseOrderProductId
                            `,
                            {
                                purchaseOrderProductId
                            }
                        ),
                        db.query(
                            `SELECT COALESCE(SUM(quantity), 0) otherwise_allocated
                                  FROM purchase_order_product_boxes popb
                                           LEFT JOIN boxes b ON b.id = popb.box_id
                                  WHERE popb.purchase_order_product_id = :purchaseOrderProductId
                                    AND shipment_id != :shipmentId
                                  GROUP BY popb.purchase_order_product_id`,
                            {
                                purchaseOrderProductId,
                                shipmentId
                            }
                        )
                    ]);
                })
                .then(
                    ([
                        [shipment],
                        [purchaseOrderProduct],
                        otherwiseAllocatedData
                    ]) => {
                        return {
                            shipment,
                            purchaseOrderProduct,
                            otherwiseAllocated:
                                otherwiseAllocatedData.length > 0
                                    ? otherwiseAllocatedData[0]
                                          .otherwiseAllocated
                                    : 0
                        };
                    }
                )
        );
    }
);

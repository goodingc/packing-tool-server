import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { DB } from "../../serviceProviders/databaseServiceProvider";

export const getPackingListAction = new Action(
    "packingList/get",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db")
                .query(
                    `
                    SELECT pop.id,
                           pop.sku,
                           pop.title,
                           pop.prep_required,
                           pop.allocated_quantity,
                           pop.order_quantity,
                           pop.accepted_quantity,
                           pop.ean,
                           pop.prep_required,
                           po.id                    po_id,
                           po.vendor_code           po_vendor_code,
                           po.delivery_window_start po_delivery_window_start,
                           po.delivery_window_end   po_delivery_window_end,
                           fc.id                    fc_id,
                           aship.id                 aship_id
                    FROM purchase_order_products pop
                             LEFT JOIN purchase_orders po ON pop.purchase_order_id = po.id
                             LEFT JOIN fulfillment_centers fc ON po.fulfillment_center_id = fc.id
                             LEFT JOIN shipments aship ON fc.active_shipment_id = aship.id
                    WHERE pop.allocated_quantity < pop.accepted_quantity
                      AND pop.accepted_quantity > 0`
                )
                .then(purchaseOrderProducts =>
                    purchaseOrderProducts.map(
                        ({
                            id,
                            sku,
                            title,
                            ean,
                            allocatedQuantity,
                            acceptedQuantity,
                            prepRequired,
                            poId,
                            poDeliveryWindowStart,
                            poDeliveryWindowEnd,
                            fcId,
                            ashipId
                        }) => {
                            return {
                                id,
                                sku,
                                title,
                                ean,
                                allocatedQuantity,
                                acceptedQuantity,
                                prepRequired,
                                purchaseOrder: {
                                    id: poId,
                                    deliveryWindow: {
                                        start: poDeliveryWindowStart,
                                        end: poDeliveryWindowEnd
                                    },
                                    fulfillmentCenter: {
                                        id: fcId,
                                        activeShipmentId: ashipId
                                    }
                                }
                            };
                        }
                    )
                )
        );
    }
);

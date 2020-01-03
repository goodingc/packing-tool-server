import {Action} from "../../micro-node";
import {ReplyFunction} from "../../micro-node/Message";
import {DB} from "../../serviceProviders/databaseServiceProvider";

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
                                   pop.accepted_quantity - pop.shipped_quantity unshipped_quantity,
                                   pop.ean,
                                   pop.prep_required,
                                   po.id                                        po_id,
                                   po.vendor_code                               po_vendor_code,
                                   po.delivery_window_start                     po_delivery_window_start,
                                   po.delivery_window_end                       po_delivery_window_end,
                                   fc.id                                        fc_id,
                                   aship.id                                     aship_id
                            FROM packing_tool.purchase_order_products pop
                                     LEFT JOIN packing_tool.purchase_orders po ON pop.purchase_order_id = po.id
                                     LEFT JOIN packing_tool.fulfillment_centers fc ON po.fulfillment_center_id = fc.id
                                     LEFT JOIN packing_tool.shipments aship ON fc.active_shipment_id = aship.id
                            WHERE pop.shipped_quantity < pop.accepted_quantity
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
                             unshippedQuantity,
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
                                unshippedQuantity,
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

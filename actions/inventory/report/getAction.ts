import { Action } from "../../../micro-node";
import { ReplyFunction } from "../../../micro-node/Message";
import { DB } from "../../../serviceProviders/databaseServiceProvider";

export const getInventoryReportAction = new Action(
    "inventory/report/get",
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
                                   po.id                                                                 po_id,
                                   fc.id                                                                 fc_id,
                                   pop.title,
                                   pop.allocated_quantity,
                                   pop.shipped_quantity,
                                   pop.accepted_quantity - pop.shipped_quantity - pop.allocated_quantity unallocated_quantity,
                                   po.delivery_window_start                                              po_delivery_window_start,
                                   po.delivery_window_end                                                po_delivery_window_end,
                                   COALESCE(p.stock_level, 0)                                            stock_level,
                                   p.stock_locations
                            FROM packing_tool.purchase_order_products pop
                                     LEFT JOIN packing_tool.purchase_orders po ON pop.purchase_order_id = po.id
                                     LEFT JOIN packing_tool.fulfillment_centers fc ON po.fulfillment_center_id = fc.id
                                     LEFT JOIN packing_tool.shipments aship ON fc.active_shipment_id = aship.id
                                     LEFT JOIN packing_tool.products p on pop.sku = p.sku
                            WHERE pop.shipped_quantity < pop.accepted_quantity
                              AND pop.accepted_quantity > 0
                              AND NOT po.cancelled
                            ORDER BY pop.sku`
                )
                .then(purchaseOrderProducts =>
                    purchaseOrderProducts.map(
                        ({
                            id,
                            sku,
                            poId,
                            fcId,
                            title,
                            allocatedQuantity,
                            shippedQuantity,
                            unallocatedQuantity,
                            poDeliveryWindowStart,
                            poDeliveryWindowEnd,
                            stockLevel,
                            stockLocations
                        }) => {
                            return {
                                id,
                                sku,
                                title,
                                allocatedQuantity,
                                shippedQuantity,
                                unallocatedQuantity,
                                purchaseOrder: {
                                    id: poId,
                                    deliveryWindow: {
                                        start: poDeliveryWindowStart,
                                        end: poDeliveryWindowEnd
                                    },
                                    fulfillmentCenterId: fcId
                                },
                                stockLevel,
                                stockLocations
                            };
                        }
                    )
                )
        );
    }
);

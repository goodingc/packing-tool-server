import { MicroNode } from "./micro-node";
import { databaseServiceProvider } from "./serviceProviders/databaseServiceProvider";
import { selectAllModelAction } from "./actions/models/selectAllAction";
import { getPackingListAction } from "./actions/packingList/getAction";
import { getShipmentAllocationDataAction } from "./actions/shipments/allocate/getDataAction";
import { addShipmentBoxesAction } from "./actions/shipments/addBoxesAction";
import { saveAllocationAction } from "./actions/shipments/allocate/saveAction";
import { getAllShipmentsAction } from "./actions/shipments/getAllAction";
import { getShipmentDataAction } from "./actions/shipments/getDataAction";
import { notificationServiceProvider } from "./serviceProviders/notificationServiceProvider";
import { notificationSubscriberServiceProvider } from "./serviceProviders/notificationSubscriberServiceProvider";
import { shipmentNotifierServiceProvider } from "./serviceProviders/shipmentNotifierServiceProvider";
import { closeShipmentAction } from "./actions/shipments/closeAction";
import { stockTakeProductSearchAction } from "./actions/stockTake/productSearchAction";
import { stockTakeSubmitChangeAction } from "./actions/stockTake/submitChangeAction";
import { getStockTakeQuantitiesAction } from "./actions/stockTake/getQuantitiesAction";
import { addPurchaseOrderAction } from "./actions/importPurchaseOrders/addPurchaseOrder";
import { swapShipmentBoxesAction } from "./actions/shipments/boxes/swapAction";
import { clearEmptyShipmentBoxesAction } from "./actions/shipments/boxes/clearEmptyTrailingAction";
import { addInventoryProductsAction } from "./actions/inventory/import/addProductsAction";
import { clearInventoryAction } from "./actions/inventory/import/clearAction";
import { getInventoryReportAction } from "./actions/inventory/report/getAction";
import { stockTakeEditChangeAction } from "./actions/stockTake/editChange";
import { getStockTakeRecentChangesAction } from "./actions/stockTake/getRecentChanges";
import { getFulfillmentCentersAction } from "./actions/importPurchaseOrders/v2/getFulfillmentCentersAction";

const server = new MicroNode(
    8000,
    [
        selectAllModelAction,
        getPackingListAction,
        getShipmentAllocationDataAction,
        addShipmentBoxesAction,
        saveAllocationAction,
        getAllShipmentsAction,
        getShipmentDataAction,
        closeShipmentAction,
        stockTakeProductSearchAction,
        stockTakeSubmitChangeAction,
        getStockTakeQuantitiesAction,
        addPurchaseOrderAction,
        swapShipmentBoxesAction,
        clearEmptyShipmentBoxesAction,
        addInventoryProductsAction,
        clearInventoryAction,
        getInventoryReportAction,
        stockTakeEditChangeAction,
        getStockTakeRecentChangesAction,
        getFulfillmentCentersAction
    ],
    [databaseServiceProvider, notificationServiceProvider],
    [notificationSubscriberServiceProvider, shipmentNotifierServiceProvider],
    []
);

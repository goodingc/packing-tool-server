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
import { addPurchaseOrderAction } from "./actions/uploadData/addPurchaseOrder";

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
        addPurchaseOrderAction
    ],
    [databaseServiceProvider, notificationServiceProvider],
    [notificationSubscriberServiceProvider, shipmentNotifierServiceProvider],
    []
);

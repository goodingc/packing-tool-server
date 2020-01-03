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

const server = new MicroNode(
    8002,
    [
        selectAllModelAction,
        getPackingListAction,
        getShipmentAllocationDataAction,
        addShipmentBoxesAction,
        saveAllocationAction,
        getAllShipmentsAction,
        getShipmentDataAction,
        closeShipmentAction
    ],
    [databaseServiceProvider, notificationServiceProvider],
    [notificationSubscriberServiceProvider, shipmentNotifierServiceProvider],
    []
);

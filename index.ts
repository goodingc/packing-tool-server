import { MicroNode } from "./micro-node";
import { databaseServiceProvider } from "./serviceProviders/databaseServiceProvider";
import { selectAllModelAction } from "./actions/models/selectAllAction";
import { getPackingListAction } from "./actions/packingList/getAction";
import { getShipmentAllocationDataAction } from "./actions/shipments/allocate/getDataAction";
import { shipmentSubscriptionHandlerServiceProvider } from "./serviceProviders/shipmentSubscriptionHandlerServiceProvider";
import {shipmentSubscriberServiceProvider} from "./serviceProviders/shipmentSubscriberServiceProvider";
import {addShipmentBoxesAction} from "./actions/shipments/addBoxesAction";
import {saveAllocationAction} from "./actions/shipments/allocate/saveAction";

const server = new MicroNode(
    8002,
    [
        selectAllModelAction,
        getPackingListAction,
        getShipmentAllocationDataAction,
        addShipmentBoxesAction,
        saveAllocationAction
    ],
    [databaseServiceProvider, shipmentSubscriptionHandlerServiceProvider],
    [shipmentSubscriberServiceProvider],
    []
);

import { ConnectionServiceProvider } from "../micro-node";
import { ShipmentSubscriptionHandler } from "./shipmentSubscriptionHandlerServiceProvider";
import { HandleCloseFunction, SendFunction } from "../micro-node/Connection";

export const shipmentSubscriberServiceProvider = new ConnectionServiceProvider<
    ShipmentSubscriber
>(
    "shipmentSubscriber",
    ["send", "handleClose"],
    (getGlobalServicePayload, getConnectionServicePayload) => {
        const shipmentSubscriptionHandler = getGlobalServicePayload<
            ShipmentSubscriptionHandler
        >("shipmentSubscriptionHandler");

        const subscribe = (
            shipmentId: number,
            purchaseOrderProductId: number,
            tag: string
        ) => {
            subscription = {
                shipmentId,
                purchaseOrderProductId,
                update(data) {
                    getConnectionServicePayload<SendFunction>("send")(
                        "shipments/allocate/update",
                        data,
                        tag
                    );
                }
            };
            getConnectionServicePayload<HandleCloseFunction>("handleClose")(
                shipmentSubscriptionHandler.subscribe(subscription)
            );
        };


        let subscription = null;

        const sendUpdate = () => {
            shipmentSubscriptionHandler.sendUpdate(subscription);
        };

        return Promise.resolve({
            subscribe,
            sendUpdate
        });
    }
);

export interface ShipmentSubscriber {
    subscribe: (
        shipmentId: number,
        purchaseOrderProductId: number,
        tag: string
    ) => void;
    sendUpdate: VoidFunction;
}

import { NotificationService } from "./notificationServiceProvider";
import { ConnectionServiceProvider } from "../micro-node";
import { HandleCloseFunction } from "../micro-node/Connection";

export const notificationSubscriberServiceProvider = new ConnectionServiceProvider<
    NotificationSubscriber
>(
    "notificationSubscriber",
    ["handleClose"],
    (getGlobalServicePayload, getConnectionServicePayload) => {
        const notifications = getGlobalServicePayload<NotificationService>(
            "notifications"
        );

        const subscribe = (
            notificationName: string,
            handler: (data?: any) => void,
            handleNow?: boolean
        ) => {
            getConnectionServicePayload<HandleCloseFunction>("handleClose")(
                notifications.subscribe(notificationName, handler, handleNow)
            );
        };
        return Promise.resolve({
            subscribe,
            notify: notifications.notify
        });
    }
);

export interface NotificationSubscriber {
    subscribe: (
        notificationName: string,
        handler: (data?: any) => void,
        handleNow?: boolean
    ) => void;
    notify: (notificationName: string, data?: any) => void;
}

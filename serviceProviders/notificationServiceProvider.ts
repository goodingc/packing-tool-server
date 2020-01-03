import { GlobalServiceProvider } from "../micro-node";
import { LocalLogger } from "../micro-node/LocalLogger";

export const notificationServiceProvider = new GlobalServiceProvider<
    NotificationService
>("notifications", ["localLogger"], getGlobalServicePayload => {
    const notifications: Notification[] = [];

    const localLogger = getGlobalServicePayload<LocalLogger>("localLogger");

    const unsubscribe = (notificationName: string, tag: string) => {
        const notification = notifications.find(
            n => n.name === notificationName
        );
        if (notification) {
            notification.subscriptions = notification.subscriptions.filter(
                subscription => subscription.tag != tag
            );
        }
    };

    const subscribe = (
        notificationName: string,
        handler: (data?: any) => void,
        handleNow = false
    ) => {
        if (handleNow) handler();
        let notification = notifications.find(n => n.name === notificationName);
        if (!notification) {
            notification = {
                name: notificationName,
                subscriptions: []
            };
            notifications.push(notification);
        }
        const tag = Math.random()
            .toString(16)
            .substr(2);
        notification.subscriptions.push({
            tag,
            handler
        });
        return () => unsubscribe(notificationName, tag);
    };

    const notify = (notificationName: string, data?: any) => {
        notifications.forEach(notification => {
            if (notification.name === notificationName) {
                notification.subscriptions.forEach(subscription => {
                    subscription.handler(data);
                });
            }
        });
    };

    return Promise.resolve({
        subscribe,
        notify
    });
});

export interface NotificationService {
    subscribe: (
        notificationName: string,
        handler: (data?: any) => void,
        handleNow?: boolean
    ) => VoidFunction;
    notify: (notificationName: string, data?: any) => void;
}

interface Notification {
    name: string;
    subscriptions: {
        tag: string;
        handler: (data: any) => void;
    }[];
}

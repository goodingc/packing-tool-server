import { LocalLogger } from "./LocalLogger";
import { connection as WebSocketConnection } from "websocket";

import { Action } from "./Action";
import { GlobalService, GlobalServiceProvider } from "./service/GlobalService";
import {
    ConnectionService,
    ConnectionServiceProvider
} from "./service/ConnectionService";
import { loadServiceScope } from "./service/Service";
import {
    MessageService,
    MessageServiceProvider
} from "./service/MessageService";
import { SendFunction } from "./Connection";

export class Message {
    actionName: string;
    payload: any;
    tag: string;

    messageServices: MessageService<any>[];

    messageServiceLogger: LocalLogger;

    constructor(
        data: any,
        public globalServices: GlobalService<any>[],
        public connectionServices: ConnectionService<any>[],
        public messageServiceProviders: MessageServiceProvider<any>[],
        public actions: Action[],
        public logger: LocalLogger
    ) {
        if (data.action) this.actionName = data.action;
        else {
            logger.error("Message has no action:", data);
            return;
        }
        this.payload = data.payload;
        this.tag = data.tag;
        logger.info("Received message for action", this.actionName);

        this.messageServiceLogger = logger.tag("Message Services");

        this.exposeAsService<any>("messagePayload", this.payload);
        this.exposeAsService<string>("actionName", this.actionName);
        this.exposeAsService<string>("tag", this.tag);
        this.exposeAsService<(action: Action) => void>(
            "addAction",
            (action: Action) => {
                this.actions.push(action);
            }
        );

        messageServiceProviders.push(
            new MessageServiceProvider<any>(
                "query",
                ["addAction", "tag"],
                (
                    getGlobalServicePayload,
                    getConnectionServicePayload,
                    getMessageServicePayload
                ) => {
                    return Promise.resolve(
                        (
                            connection: WebSocketConnection,
                            action: string,
                            payload: any
                        ) => {
                            return new Promise((resolve, reject) => {
                                getMessageServicePayload<
                                    (action: Action) => void
                                >("addAction")(
                                    new Action(
                                        action + "/reply",
                                        (
                                            getGlobalServicePayload,
                                            getConnectionServicePayload,
                                            getMessageServicePayload
                                        ) => {
                                            const replyPayload = getMessageServicePayload<
                                                any
                                            >("messagePayload");
                                            if (replyPayload.success) {
                                                resolve(replyPayload.data);
                                            } else if (
                                                replyPayload.success === false
                                            ) {
                                                reject(replyPayload.error);
                                            }
                                            resolve(replyPayload);
                                        }
                                    )
                                );
                                connection.send(
                                    JSON.stringify({
                                        action,
                                        payload,
                                        tag: getMessageServicePayload<string>(
                                            "tag"
                                        )
                                    })
                                );
                            });
                        }
                    );
                }
            )
        );

        messageServiceProviders.push(
            new MessageServiceProvider<ReplyFunction>(
                "reply",
                ["actionName", "tag"],
                (
                    getGlobalServicePayload,
                    getConnectionServicePayload,
                    getMessageServicePayload
                ) => {
                    return Promise.resolve((payload: Promise<any> | any) => {
                        const reply = (payload: any) => {
                            getConnectionServicePayload<SendFunction>("send")(
                                getMessageServicePayload<string>("actionName") +
                                    "/reply",
                                payload,
                                getMessageServicePayload<string>("tag")
                            );
                        };
                        if (payload instanceof Promise) {
                            payload
                                .then(data => {
                                    reply({
                                        success: true,
                                        data
                                    });
                                })
                                .catch(error => {
                                    reply({
                                        success: false,
                                        error
                                    });
                                });
                        } else {
                            reply(payload);
                        }
                    });
                }
            )
        );

        loadServiceScope<MessageService<any>, MessageServiceProvider<any>>(
            messageServiceProviders,
            this.messageServiceLogger,
            [globalServices, connectionServices]
        ).then(messageServices => {
            this.messageServices = messageServices;
            const messageServicePayloadResolverFactory = MessageServiceProvider.servicePayloadResolverFactory(
                messageServices
            );
            for (const action of actions) {
                if (action.name === this.actionName) {
                    action.handle(
                        GlobalServiceProvider.servicePayloadResolverFactory(
                            globalServices
                        ),
                        ConnectionServiceProvider.servicePayloadResolverFactory(
                            connectionServices
                        ),
                        messageServicePayloadResolverFactory
                    );
                    return;
                }
            }
            messageServicePayloadResolverFactory<ReplyFunction>("reply")(
                Promise.reject(`No action found for ${this.actionName}`)
            );
            logger.warning("No action found for", this.actionName);
        });
    }

    exposeAsService<P>(name: string, payload: P): void {
        this.messageServiceProviders.push(
            new MessageServiceProvider<P>(name, [], () =>
                Promise.resolve(payload)
            )
        );
    }
}

export type ReplyFunction = (payload: Promise<any> | any) => void;

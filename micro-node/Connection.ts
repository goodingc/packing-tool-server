import { connection as WebSocketConnection } from "websocket";
import { Message } from "./Message";
import { LocalLogger } from "./LocalLogger";

import { Action } from "./Action";
import {
    ConnectionService,
    ConnectionServiceProvider
} from "./service/ConnectionService";
import { GlobalService } from "./service/GlobalService";
import { loadServiceScope } from "./service/Service";
import { MessageServiceProvider } from "./service/MessageService";

export class Connection {
    connectionServices: ConnectionService<any>[];
    connectionServiceLogger: LocalLogger;

    constructor(
        public webSocketConnection: WebSocketConnection,
        public globalServices: GlobalService<any>[],
        public connectionServiceProviders: ConnectionServiceProvider<any>[],
        messageServiceProviders: MessageServiceProvider<any>[],
        public actions: Action[],
        public logger: LocalLogger
    ) {
        this.connectionServiceLogger = logger.tag("Connection Services");

        this.exposeAsService<LocalLogger>(
            "localLogger",
            this.connectionServiceLogger
        );

        this.exposeAsService<SendFunction>(
            "send",
            (action: string, payload: any, tag?: string) => {
                webSocketConnection.send(
                    JSON.stringify({
                        action,
                        payload,
                        tag:
                            tag ||
                            Math.random()
                                .toString(16)
                                .substr(2)
                    })
                );
            }
        );

        this.exposeAsService<HandleCloseFunction>("handleClose", (handler: (code, desc) => void) => {
            webSocketConnection.on("close", handler)
        })

        this.exposeAsService("addAction", (action: Action) => {
            this.actions.push(action);
        });

        this.connectionServiceLogger.info("Loading");

        loadServiceScope<
            ConnectionService<any>,
            ConnectionServiceProvider<any>
        >(connectionServiceProviders, this.connectionServiceLogger, [
            globalServices
        ]).then(connectionServices => {
            this.connectionServices = connectionServices;
            webSocketConnection.on("message", data => {
                new Message(
                    JSON.parse(data.utf8Data),
                    globalServices,
                    connectionServices,
                    [...messageServiceProviders],
                    actions,
                    logger.tag("Message")
                );
            });
        });
    }

    exposeAsService<P>(name: string, payload: P): void {
        this.connectionServiceProviders.push(
            new ConnectionServiceProvider<P>(name, [], () =>
                Promise.resolve(payload)
            )
        );
    }
}

export type SendFunction = (action: string, payload: any, tag?: string) => void;
export type HandleCloseFunction = (handler: (code, desc) => void) => void;
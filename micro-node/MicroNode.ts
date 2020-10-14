import { LocalLogger } from "./LocalLogger";
import {
    server as WebSocketServer,
    connection as WebSocketConnection
} from "websocket";
import { Server as HTTPServer } from "http";
import { Connection } from "./Connection";
import { Action } from "./Action";
import { GlobalService, GlobalServiceProvider } from "./service/GlobalService";
import { ConnectionServiceProvider } from "./service/ConnectionService";
import { loadServiceScope } from "./service/Service";
import { MessageServiceProvider } from "./service/MessageService";
import { nodeConnectServiceProviderBundle } from "./internalServiceProviderBundles/nodeConnectServiceProviderBundle";
import { ServiceProviderBundle } from "./ServiceProviderBundle";
import { requireInputsServiceProviderBundle } from "./internalServiceProviderBundles/requireInputsServiceProviderBundle";

class MicroNode {
    rootLogger: LocalLogger;
    serverLogger: LocalLogger;
    globalServiceLogger: LocalLogger;
    webSocketServer: WebSocketServer;
    connections: Connection[] = [];

    globalServices: GlobalService<any>[];

    constructor(
        public port: number = 8000,
        public actions: Action[],
        public globalServiceProviders: GlobalServiceProvider<any>[],
        public connectionServiceProviders: ConnectionServiceProvider<any>[],
        public messageServiceProviders: MessageServiceProvider<any>[]
    ) {
        //Setting up loggers
        this.rootLogger = new LocalLogger();
        this.globalServiceLogger = this.rootLogger.tag("Global Services");
        this.serverLogger = this.rootLogger.tag("Server");

        //Add logger as global service
        globalServiceProviders.push(
            new GlobalServiceProvider<LocalLogger>("localLogger", [], () =>
                Promise.resolve(this.globalServiceLogger)
            )
        );

        [
            nodeConnectServiceProviderBundle,
            requireInputsServiceProviderBundle
        ].forEach((serviceProviderBundle: ServiceProviderBundle) => {
            serviceProviderBundle.apply(
                globalServiceProviders,
                connectionServiceProviders,
                messageServiceProviders
            );
        });

        this.globalServiceLogger.info("Loading");

        loadServiceScope<GlobalService<any>, GlobalServiceProvider<any>>(
            globalServiceProviders,
            this.globalServiceLogger
        ).then(globalServices => {
            this.globalServices = globalServices;
            this.serverLogger.info("Starting");
            const httpServer: HTTPServer = new HTTPServer((req, res) => {
                this.serverLogger.info(
                    `Received HTTP request from ${req.headers.host}`
                );
                res.writeHead(404);
                res.end();
            });
            httpServer.listen(port, () => {
                this.serverLogger.success(`Server listening on port ${port}`);
            });
            this.webSocketServer = new WebSocketServer({
                httpServer,
                maxReceivedMessageSize: 10 * 1000 * 1000,
                maxReceivedFrameSize: 10 * 1000 * 1000
            });
            this.webSocketServer.on("request", request => {
                const webSocketConnection: WebSocketConnection = request.accept();
                this.connections.push(
                    new Connection(
                        webSocketConnection,
                        globalServices,
                        [...connectionServiceProviders],
                        messageServiceProviders,
                        [...actions],
                        this.rootLogger.tag("Connection")
                    )
                );
            });
        });
    }
}

export { MicroNode };

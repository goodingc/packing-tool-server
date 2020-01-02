import {
    client as WebSocketClient,
    connection as WebSocketConnection,
    IMessage as WebSocketMessage
} from "websocket";
import { GlobalServiceProvider } from "../service/GlobalService";
import { MessageServiceProvider } from "../service/MessageService";
import { ServiceProviderBundle } from "../ServiceProviderBundle";

class NodeConnector {
    webSocketClient: WebSocketClient;
    webSocketConnection: WebSocketConnection;
    tagFilters: TagFilter[] = [];

    constructor(
        address: string,
        port: number,
        onConnect: VoidFunction,
        onConnectFail: VoidFunction
    ) {
        this.webSocketClient = new WebSocketClient();
        this.webSocketClient.on(
            "connect",
            (connection: WebSocketConnection) => {
                this.webSocketConnection = connection;
                connection.on("message", (message: WebSocketMessage) => {
                    const data = JSON.parse(message.utf8Data);
                    for (const tagFilter of this.tagFilters) {
                        if (tagFilter.tag === data.tag) {
                            for (const handler of tagFilter.handlers) {
                                if (handler.action === data.action) {
                                    handler.handler(data.payload);
                                    break;
                                }
                            }
                            break;
                        }
                    }
                });
                console.log("connected");
                onConnect();
            }
        );
        this.webSocketClient.on("connectFailed", onConnectFail);
        this.webSocketClient.connect(`ws://${address}:${port}/`);
    }

    static connect(address: string, port: number): Promise<NodeConnector> {
        return new Promise<NodeConnector>((resolve, reject) => {
            const nodeConnector = new NodeConnector(
                address,
                port,
                () => {
                    resolve(nodeConnector);
                },
                reject
            );
        });
    }

    send(action: string, payload: any, tag: string) {
        console.log("sending");
        this.webSocketConnection.send(
            JSON.stringify({
                action,
                payload,
                tag
            })
        );
    }
}

interface TagFilter {
    tag: string;
    handlers: Handler[];
}

interface Handler {
    action: string;
    handler: (payload: any) => void;
}

type SendToNodeFunction = (
    nodeConnector: NodeConnector,
    action: string,
    payload: any,
    handlers: Handler[]
) => void;

const sendToNodeServiceProvider = new MessageServiceProvider<
    SendToNodeFunction
>(
    "sendToNode",
    ["tag"],
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        return Promise.resolve(
            (
                nodeConnector: NodeConnector,
                action: string,
                payload: any,
                handlers: Handler[]
            ): void => {
                const tag = getMessageServicePayload<string>("tag");

                nodeConnector.tagFilters.push({
                    tag,
                    handlers
                });

                nodeConnector.send(action, payload, tag);
            }
        );
    }
);

type ConnectToNodeFunction = (
    address: string,
    port: number
) => Promise<NodeConnector>;

const connectToNodeServiceProvider = new GlobalServiceProvider<
    ConnectToNodeFunction
>("connectToNode", [], () => {
    return Promise.resolve(NodeConnector.connect);
});

const nodeConnectServiceProviderBundle = new ServiceProviderBundle(
    [connectToNodeServiceProvider],
    [],
    [sendToNodeServiceProvider]
);

export {
    nodeConnectServiceProviderBundle,
    ConnectToNodeFunction,
    SendToNodeFunction
};

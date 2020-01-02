import { GlobalServicePayloadResolver } from "./service/GlobalService";
import { ConnectionServicePayloadResolver } from "./service/ConnectionService";
import { MessageServicePayloadResolver } from "./service/MessageService";

class Action {
    constructor(
        public name: string,
        public handler: (
            getGlobalServicePayload: GlobalServicePayloadResolver,
            getConnectionServicePayload: ConnectionServicePayloadResolver,
            getMessageServicePayload: MessageServicePayloadResolver
        ) => void
    ) {}

    handle(
        getGlobalServicePayload: GlobalServicePayloadResolver,
        getConnectionServicePayload: ConnectionServicePayloadResolver,
        getMessageServicePayload: MessageServicePayloadResolver
    ): void {
        this.handler(
            getGlobalServicePayload,
            getConnectionServicePayload,
            getMessageServicePayload
        );
    }
}

export { Action };

import { GlobalServiceProvider } from "./service/GlobalService";
import { ConnectionServiceProvider } from "./service/ConnectionService";
import { MessageServiceProvider } from "./service/MessageService";

class ServiceProviderBundle {
    constructor(
        public globalServiceProviders: GlobalServiceProvider<any>[],
        public connectionServiceProviders: ConnectionServiceProvider<any>[],
        public messageServiceProviders: MessageServiceProvider<any>[]
    ) {}

    apply(
        globalServiceProviders: GlobalServiceProvider<any>[],
        connectionServiceProviders: ConnectionServiceProvider<any>[],
        messageServiceProviders: MessageServiceProvider<any>[]
    ) {
        globalServiceProviders.push(...this.globalServiceProviders);
        connectionServiceProviders.push(...this.connectionServiceProviders);
        messageServiceProviders.push(...this.messageServiceProviders);
    }
}

export { ServiceProviderBundle };

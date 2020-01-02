import { Service, ServicePayloadResolver, ServiceProvider } from "./Service";
import {
    ConnectionService,
    ConnectionServicePayloadResolver,
    ConnectionServiceProvider
} from "./ConnectionService";
import {
    GlobalService,
    GlobalServicePayloadResolver,
    GlobalServiceProvider
} from "./GlobalService";

type MessageServicePayloadResolver = ServicePayloadResolver<
    MessageService<any>
>;

interface MessageService<P> extends Service<P> {}

class MessageServiceProvider<P> extends ServiceProvider<P, MessageService<P>> {
    constructor(
        name: string,
        requiredPeerServices: string[] = [],
        generator: (
            getGlobalServicePayload: GlobalServicePayloadResolver,
            getConnectionServicePayload: ConnectionServicePayloadResolver,
            getMessageServicePayload: MessageServicePayloadResolver
        ) => Promise<P>
    ) {
        super(name, requiredPeerServices, generator);
    }

    generate(
        messageServices: MessageService<any>[],
        [globalServices, connectionServices]: [
            GlobalService<any>[],
            ConnectionService<any>[]
        ]
    ): Promise<ConnectionService<P>> {
        return this.generator(
            GlobalServiceProvider.servicePayloadResolverFactory(globalServices),
            ConnectionServiceProvider.servicePayloadResolverFactory(
                connectionServices
            ),
            MessageServiceProvider.servicePayloadResolverFactory(messageServices)
        ).then(payload => {
            return {
                name: this.name,
                payload
            };
        });
    }

    static servicePayloadResolverFactory(
        scopedServices: MessageService<any>[]
    ): MessageServicePayloadResolver {
        return ServiceProvider.servicePayloadResolverFactory<
            MessageService<any>
        >(scopedServices);
    }
}


export {MessageService, MessageServiceProvider, MessageServicePayloadResolver}
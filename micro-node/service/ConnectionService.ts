import { Service, ServicePayloadResolver, ServiceProvider } from "./Service";
import {
    GlobalService,
    GlobalServicePayloadResolver,
    GlobalServiceProvider
} from "./GlobalService";

type ConnectionServicePayloadResolver = ServicePayloadResolver<
    ConnectionService<any>
>;

interface ConnectionService<P> extends Service<P> {}

class ConnectionServiceProvider<P> extends ServiceProvider<
    P,
    ConnectionService<P>
> {
    constructor(
        name: string,
        requiredPeerServices: string[] = [],
        generator: (
            getGlobalServicePayload: GlobalServicePayloadResolver,
            getConnectionServicePayload: ConnectionServicePayloadResolver
        ) => Promise<P>
    ) {
        super(name, requiredPeerServices, generator);
    }

    generate(
        connectionServices: ConnectionService<any>[],
        [globalServices]: [GlobalService<any>[]]
    ): Promise<ConnectionService<P>> {
        return this.generator(
            GlobalServiceProvider.servicePayloadResolverFactory(globalServices),
            ConnectionServiceProvider.servicePayloadResolverFactory(connectionServices)
        ).then(payload => {
            return {
                name: this.name,
                payload
            };
        });
    }

    static servicePayloadResolverFactory(
        scopedServices: ConnectionService<any>[]
    ): ConnectionServicePayloadResolver {
        return ServiceProvider.servicePayloadResolverFactory<
            ConnectionService<any>
        >(scopedServices);
    }
}

export { ConnectionService, ConnectionServiceProvider, ConnectionServicePayloadResolver};

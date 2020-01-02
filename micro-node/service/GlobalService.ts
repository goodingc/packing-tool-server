import { Service, ServicePayloadResolver, ServiceProvider } from "./Service";

type GlobalServicePayloadResolver = ServicePayloadResolver<GlobalService<any>>;

interface GlobalService<P> extends Service<P> {}

class GlobalServiceProvider<P> extends ServiceProvider<P, GlobalService<P>> {
    constructor(
        name: string,
        requiredPeerServices: string[] = [],
        generator: (
            getGlobalServicePayload: GlobalServicePayloadResolver
        ) => Promise<P>
    ) {
        super(name, requiredPeerServices, generator);
    }

    generate(globalServices: GlobalService<any>[]): Promise<GlobalService<P>> {
        return this.generator(
            GlobalServiceProvider.servicePayloadResolverFactory(globalServices)
        ).then(payload => {
            return {
                name: this.name,
                payload
            };
        });
    }

    static servicePayloadResolverFactory(
        scopedServices: GlobalService<any>[]
    ): GlobalServicePayloadResolver {
        return ServiceProvider.servicePayloadResolverFactory<
            GlobalService<any>
        >(scopedServices);
    }
}

export { GlobalService, GlobalServiceProvider, GlobalServicePayloadResolver};

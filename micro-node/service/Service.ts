import { LocalLogger } from "../LocalLogger";
import { GlobalServicePayloadResolver } from "./GlobalService";
import { ConnectionServicePayloadResolver } from "./ConnectionService";
import { MessageServicePayloadResolver } from "./MessageService";

class ServiceProvider<P, S extends Service<any>> {
    constructor(
        public name: string,
        public requiredPeerServices: string[] = [],
        public generator: (
            getGlobalServicePayload?: GlobalServicePayloadResolver,
            getConnectionServicePayload?: ConnectionServicePayloadResolver,
            getActionServicePayload?: MessageServicePayloadResolver
        ) => Promise<P>
    ) {}

    generate(
        peerServices: S[],
        outOfScopeServices?: Service<any>[][]
    ): Promise<S> {
        return Promise.reject("I shouldn't be here");
    }

    static servicePayloadResolverFactory<S extends Service<any>>(
        scopedServices: S[]
    ): ServicePayloadResolver<S> {
        return <P>(name: string): P | null => {
            for (const service of scopedServices) {
                if (service.name === name) {
                    return service.payload;
                }
            }
            return null;
        };
    }
}

interface Service<P> {
    name: string;
    payload: P;
}

type ServicePayloadResolver<S extends Service<any>> = <P>(
    name: string
) => P | null;

const loadServiceScope = <
    S extends Service<any>,
    SP extends ServiceProvider<any, S>
>(
    scopedServiceProviders: SP[],
    logger: LocalLogger,
    outOfScopeServices?: Service<any>[][]
): Promise<S[]> => {
    const loadedServices: S[] = [];

    const loadServiceLayer = (layerIndex: number = 0) =>
        Promise.all(
            scopedServiceProviders
                .filter(serviceProvider => {
                    for (const loadedService of loadedServices) {
                        if (loadedService.name === serviceProvider.name)
                            return false;
                    }
                    for (const requiredPeerService of serviceProvider.requiredPeerServices) {
                        let peerServiceIsLoaded: boolean = false;
                        for (const loadedService of loadedServices) {
                            if (loadedService.name === requiredPeerService) {
                                peerServiceIsLoaded = true;
                                break;
                            }
                        }
                        if (!peerServiceIsLoaded) return false;
                    }
                    return true;
                })
                .map(serviceProviderToLoad => {
                    return serviceProviderToLoad
                        .generate(loadedServices, outOfScopeServices)
                        .then(loadedService => {
                            loadedServices.push(loadedService);
                        })
                        .catch(error => {
                            logger.error(
                                "Failed to load",
                                serviceProviderToLoad.name,
                                error
                            );
                        });
                })
        )
            .then(() => {
                logger.success("Loaded service layer", layerIndex);
                if (loadedServices.length < scopedServiceProviders.length) {
                    return loadServiceLayer(++layerIndex);
                }
            })
            .catch(error => {
                logger.error("Failed to load service layer", layerIndex, error);
            });

    return loadServiceLayer()
        .then(() => {
            logger.success("Loaded serviceProviders");
            return loadedServices;
        })
        .catch(error => {
            logger.error("Failed to load serviceProviders", error);
        });
};

export { Service, ServiceProvider, loadServiceScope, ServicePayloadResolver };

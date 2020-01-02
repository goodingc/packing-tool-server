import { MessageServiceProvider } from "../service/MessageService";
import { ServiceProviderBundle } from "../ServiceProviderBundle";

export type RequireInputsFunction = (
    ...requiredInputs: string[]
) => Promise<any[]>;

const requireInputsServiceProvider = new MessageServiceProvider<
    RequireInputsFunction
>(
    "requireInputs",
    ["messagePayload"],
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        return Promise.resolve(
            (...requiredInputs: string[]): Promise<any> =>
                new Promise((resolve, reject) => {
                    const messagePayload = getMessageServicePayload<any>(
                        "messagePayload"
                    );
                    resolve(
                        requiredInputs.map(requiredInput => {
                            if (!messagePayload.hasOwnProperty(requiredInput)) {
                                reject(
                                    `Missing required input ${requiredInput}`
                                );
                            }
                            return messagePayload[requiredInput];
                        })
                    );
                })
        );
    }
);

export const requireInputsServiceProviderBundle = new ServiceProviderBundle(
    [],
    [],
    [requireInputsServiceProvider]
);

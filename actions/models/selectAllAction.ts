import { Action } from "../../micro-node";
import { ReplyFunction } from "../../micro-node/Message";
import { snake } from "case";
import { RequireInputsFunction } from "../../micro-node/internalServiceProviderBundles/requireInputsServiceProviderBundle";
import {DB} from "../../serviceProviders/databaseServiceProvider";

export const selectAllModelAction = new Action(
    "models/selectAll",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getMessageServicePayload<RequireInputsFunction>("requireInputs")(
                "model"
            ).then(([model]) =>
                getGlobalServicePayload<DB>("db").query(
                    "SELECT * FROM " + snake(model)
                )
            )
        );
    }
);

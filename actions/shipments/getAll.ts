import { Action } from "../../micro-node";
import {ReplyFunction} from "../../micro-node/Message";
import {DB} from "../../serviceProviders/databaseServiceProvider";

export const getAllShipments = new Action(
    "shipments/getAll",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {
        getMessageServicePayload<ReplyFunction>("reply")(
            getGlobalServicePayload<DB>("db").query(`SELECT * FROM shipments`)
        )
    }
);

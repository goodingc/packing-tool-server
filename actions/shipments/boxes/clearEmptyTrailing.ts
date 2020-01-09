import { Action } from "../../../micro-node";

export const clearEmptyShipmentBoxesAction = new Action(
    "shipments/boxes/clearEmptyTrailing",
    (
        getGlobalServicePayload,
        getConnectionServicePayload,
        getMessageServicePayload
    ) => {}
);

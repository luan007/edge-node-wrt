export enum RPC_Message_Type { __REQUEST = 0, __RESPONSE = 1, __EVENT = 2, __READY = 3 }

//Package Format:
//[ MSG TYPE(number), TARGET_ID(number), PARAMS(object), ?TRACK_ID(number), ?GENERATION_, ... _LAST_CHK_SUM ]
//                                  ^ (func id / or event id)

export var ConvertError = function (err: Error) {
    return err ? {
        message: err.message,
        name: err.name,
        code: err["code"]
    } : undefined;
}

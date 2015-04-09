var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["GENERAL"] = 0] = "GENERAL";
    ErrorCode[ErrorCode["REQUIRE_AUTH"] = 1] = "REQUIRE_AUTH";
    ErrorCode[ErrorCode["DEVICE_NOT_FOUND"] = 5] = "DEVICE_NOT_FOUND";
})(ErrorCode || (ErrorCode = {}));
global.ErrorCode = ErrorCode;

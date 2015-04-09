var uuid = require("uuid");
global.UUIDstr = function (short) {
    if (short === void 0) { short = true; }
    if (!short)
        return uuid.v4();
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf.toString("hex");
};
global.UUID = function () {
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf;
};

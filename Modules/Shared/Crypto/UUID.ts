import uuid = require("uuid");

global.UUIDstr = function (short = true): string {
    if (!short) return uuid.v4();
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf.toString("hex");
}

global.UUID = function(): NodeBuffer {
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf;
}

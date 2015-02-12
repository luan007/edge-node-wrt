
import uuid = require("uuid");

global.UUIDstr = function (): string {
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf.toString("hex");
}

global.UUID = function(): NodeBuffer {
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf;
}

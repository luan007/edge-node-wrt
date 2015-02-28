import Core = require("Core");
import Node = require("Node");

export function Initialize(cb) {
    //Check if the folder exists..
    trace("Init..");
    //TODO: GET THIS FIXED
    //EdgeFS.Init(process.env.GUARD_PATH);
    if (!Node.fs.existsSync(CONF.USER_DATA_PATH)) {
        info("Creating User Data Dir ..");
        Node.fs.mkdirSync(CONF.USER_DATA_PATH);
    }
    trace("Preparing User Root..");
    async.series([
        exec.bind(null, "chown", "nobody", "-R", CONF.USER_DATA_PATH),
        exec.bind(null, "chmod", "711", CONF.USER_DATA_PATH)
    ], cb);
}


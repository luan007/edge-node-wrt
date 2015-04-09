var rpc = require("../../../Modules/RPC/index");
function Heartbeat(time_in, cb) {
    cb(undefined, Date.now() - time_in);
}
function DriverLoad(driverid, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].load) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].load(cb);
}
function DriverUnload(driverid, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].unload) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].unload(cb);
}
function DriverMatch(driverid, dev, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].match) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].match(dev, cb);
}
function DriverAttach(driverid, dev, matchResult, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].attach) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].attach(dev, matchResult, cb);
}
function DriverChange(driverid, dev, delta_from_other_driver, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].change) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].change(dev, delta_from_other_driver, cb);
}
function DriverDetach(driverid, dev, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].detach) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].detach(dev, cb);
}
function DriverInvoke(driverid, dev, actionId, params, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].invoke) {
        return cb(new Error("Driver Not Found / Corrupted"));
    }
    global.Drivers[driverid].invoke(actionId, params, cb);
}
function GenerateReverseAPI(r) {
    rpc.APIManager.RegisterFunction(Heartbeat, "Heartbeat");
    rpc.APIManager.RegisterFunction(DriverLoad, "Driver.Load");
    rpc.APIManager.RegisterFunction(DriverUnload, "Driver.Unload");
    rpc.APIManager.RegisterFunction(DriverMatch, "Driver.Match");
    rpc.APIManager.RegisterFunction(DriverChange, "Driver.Change");
    rpc.APIManager.RegisterFunction(DriverAttach, "Driver.Attach");
    rpc.APIManager.RegisterFunction(DriverDetach, "Driver.Detach");
    rpc.APIManager.ServeAPI(r);
    return rpc.APIManager.ToJSON();
}
exports.GenerateReverseAPI = GenerateReverseAPI;

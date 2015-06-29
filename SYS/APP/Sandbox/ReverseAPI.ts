import rpc = require("../../../Modules/RPC/index");

declare
var sandbox:local.sandbox.SandboxEnvironment; //global sandbox

/*Called by host to ensure responsiveness*/
function Heartbeat(time_in, cb) {
    cb(undefined, Date.now() - time_in); //return delta T for process management
}

/*
 *  Reverse Driver Call (v0)
 *
 *               host                    sandbox                    usercode
 *    RAPI.DriverMatch(X,data)
 *                 +-------------> DriverMatch(X,data)
 *                                          +-------------> global.Driver.X.match(data)
 *                 +---------------------Timeout                        +
 *                 |                                                    |
 *                 |                   ClearTimeout       <-------------+
 *                 +------------------------+
 *                 |
 *                 |
 *               *DONE
 */

function DriverLoad(driverid, cb:PCallback<any>) {
    //console.log('=============== global.Drivers', global.Drivers);
    if (!global.Drivers[driverid] || !global.Drivers[driverid].load) {
        return cb(new Error("[DriverLoad] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].load(cb);
}

function DriverUnload(driverid, cb:PCallback<any>) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].unload) {
        return cb(new Error("[DriverUnload] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].unload(cb);
}

function DriverMatch(driverid, dev:IDevice, delta, cb:PCallback<any>) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].match) {
        return cb(new Error("[DriverMatch] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].match(dev, delta, cb);
}

function DriverAttach(driverid, dev:IDevice, delta, matchResult:any, cb:PCallback<IDeviceAssumption>) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].attach) {
        return cb(new Error("[DriverAttach] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].attach(dev, delta, matchResult, cb);
}

function DriverChange(driverid, dev:IDevice, delta_from_other_driver:IDeviceAssumption, cb:PCallback<IDeviceAssumption>) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].change) {
        return cb(new Error("[DriverChange] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].change(dev, delta_from_other_driver, cb);
}

function DriverDetach(driverid, dev:IDevice, delta, cb:PCallback<IDeviceAssumption>) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].detach) {
        return cb(new Error("[DriverDetach] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].detach(dev, delta, cb);
}

function DriverInvoke(driverid, dev:IDevice, actionId, params, cb) {
    if (!global.Drivers[driverid] || !global.Drivers[driverid].invoke) {
        return cb(new Error("[DriverInvoke] Driver Not Found / Corrupted " + driverid));
    }
    global.Drivers[driverid].invoke(dev, actionId, params, cb);
}


export function GenerateReverseAPI(r:rpc.RPCEndpoint):any {
    /*Create Reverse API*/
    rpc.APIManager.RegisterFunction(Heartbeat, "Heartbeat");
    rpc.APIManager.RegisterFunction(DriverLoad, "Driver.Load");
    rpc.APIManager.RegisterFunction(DriverUnload, "Driver.Unload");
    rpc.APIManager.RegisterFunction(DriverMatch, "Driver.Match");
    rpc.APIManager.RegisterFunction(DriverChange, "Driver.Change");
    rpc.APIManager.RegisterFunction(DriverAttach, "Driver.Attach");
    rpc.APIManager.RegisterFunction(DriverDetach, "Driver.Detach");
    rpc.APIManager.RegisterFunction(DriverInvoke, "Driver.Invoke");
    rpc.APIManager.ServeAPI(r);
    return rpc.APIManager.ToJSON();
}
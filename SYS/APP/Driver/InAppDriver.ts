import _Runtime = require("../Runtime");
import Runtime = _Runtime.Runtime;
import StatBiz = require('../../Common/Stat/StatBiz');
/*
 * Abstraction of an In-App-Driver
*/

class InAppDriver implements IDriver {

    public Switch: boolean = true;
    public Loaded: boolean = false;

    constructor(
        public Runtime: Runtime,
        private InApp_DriverId,
        private TargetBuses: string[],
        private Interest: IDriverInterest
        ) {
    }


    __assumptions2APP(dev) {
        if(!dev) return undefined;
        try {
            var res = JSON.parse(JSON.stringify(dev));
            for (var appDrvName in res.assumptions) {
                var app = 'App_';
                var parts = appDrvName.replace(app, '').split(':');
                var appUid = parts[0];
                var runtimeId = StatBiz.GetRuntimeIdByAppUid(appUid);
                var newKey = app + runtimeId + ':' + parts[1];
                res['assumptions'][newKey] = res.assumptions[appDrvName];
                res['assumptions'][newKey]['driverId'] = newKey;
                delete res.assumptions[appDrvName];
            }
            return res;
        } catch (e) {
            console.log(e);
            return undefined;
        }
    }
    _assumption2APP(assump) {
        if(!assump) return undefined;
        try {
            var res = JSON.parse(JSON.stringify(assump));
            if(res['driverId']) {
                var app = 'App_';
                var parts = res['driverId'].replace(app, '').split(':');
                var appUid = parts[0];
                var runtimeId = StatBiz.GetRuntimeIdByAppUid(appUid);
                var newKey = app + runtimeId + ':' + parts[1];
                res['driverId'] = newKey;
            }
            return res;
        } catch(e) {
            console.log(e);
            return undefined;
        }
    }

    interest = () => {
        //fatal(this.Interest);
        return this.Interest;
    };

    id = () => {
        //return "App_" + this.App.RuntimeId + ":" + this.InApp_DriverId;
        return "App_" + this.Runtime.App.uid + ":" + this.InApp_DriverId;
    };

    name = () => {
        return this.Runtime.App.name + " - " + this.InApp_DriverId;
    };

    status = () => {
        //console.log('3.1 ====----====', this.Loaded, this.Switch, this.App.IsRunning());
        return (this.Loaded && this.Switch && this.Runtime && this.Runtime.IsRunning()) ? 1 : 0;
    };

    bus(): string[] {
        return this.TargetBuses;
    }

    match = (dev: IDevice, delta, cb: Callback) => {
        info('Match ' + this.name());
        if (!this.status()) return cb(new Error("Driver is Offline"));
        var devCopy = this.__assumptions2APP(dev);
        var deltaCopy = this._assumption2APP(delta);
        this.Runtime.API.Driver.Match(this.InApp_DriverId, devCopy, deltaCopy, cb);
    };

    attach = (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        info('Attach ' + this.name());
        if (!this.status()) return cb(new Error("Driver is Offline"));
        var devCopy = this.__assumptions2APP(dev);
        var deltaCopy = this._assumption2APP(delta);
        this.Runtime.API.Driver.Attach(this.InApp_DriverId, devCopy, deltaCopy, matchResult, cb);
    };

    change = (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        info('Change ' + this.name());
        if (!this.status()) return cb(new Error("Driver is Offline"));
        var devCopy = this.__assumptions2APP(dev);
        var deltaCopy = this._assumption2APP(delta);
        this.Runtime.API.Driver.Change(this.InApp_DriverId, devCopy, deltaCopy, cb);
    };

    detach = (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        info('Detach ' + this.name());
        if (!this.status()) return cb(new Error("Driver is Offline"));
        var devCopy = this.__assumptions2APP(dev);
        var deltaCopy = this._assumption2APP(delta);
        this.Runtime.API.Driver.Detach(this.InApp_DriverId, devCopy, deltaCopy, cb);
    };

    load = (cb: Callback) => {
        info('Load ' + this.name());
        if (this.Loaded) {
            return cb(undefined, true);
        } else {
            this.Runtime.API.Driver.Load(this.InApp_DriverId, (err, result) => {
                if (!err && result) this.Loaded = true;
                return cb(err, this.Loaded);
            });
        }
    };


    unload = (cb: Callback) => {
        if (!this.Loaded) {
            return cb(undefined, true);
        } else {
            this.Runtime.API.Driver.Unload(this.InApp_DriverId, (err, result) => {
                if (!err && result) this.Loaded = false;
                return cb(err, result);
            });
        }
    };

    invoke = (device:IDevice, actionId, params, cb) => {
        if (!this.status()) return cb(new Error("Driver is Offline"));
        var devCopy = this.__assumptions2APP(device);
        this.Runtime.API.Driver.Invoke(this.InApp_DriverId, devCopy, actionId, params, cb);
    };

}

export = InAppDriver;
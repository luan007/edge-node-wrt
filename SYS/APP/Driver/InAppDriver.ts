import Runtime = require("../Runtime");
/*
 * Abstraction of an In-App-Driver
*/

class InAppDriver implements IDriver {

    public Switch: boolean = true;
    public Loaded: boolean = false;

    constructor(
        private App: Runtime,
        private InApp_DriverId,
        private TargetBuses: string[],
        private Interest: IDriverInterest
        ) {
    }

    interest = () => {
        return this.Interest;
    };

    id = () => {
        return "App_" + this.App.App.uid + ":" + this.InApp_DriverId;
    };

    name = () => {
        return this.App.App.name + " - " + this.InApp_DriverId;
    };

    status = () => {
        return (this.Loaded && this.Switch && this.App && this.App.IsRunning()) ? 1 : 0;
    };

    bus(): string[] {
        return this.TargetBuses;
    }

    match = (dev: IDevice, delta, cb: Callback) => {
        if (!this.status()) return cb(new Error("Driver is Offline"));
        this.App.API.Driver.Match(this.InApp_DriverId, dev, cb);
    };

    attach = (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        if (!this.status()) return cb(new Error("Driver is Offline"));
        this.App.API.Driver.Attach(this.InApp_DriverId, dev, matchResult, cb);
    };

    change = (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        if (!this.status()) return cb(new Error("Driver is Offline"));
        this.App.API.Driver.Change(this.InApp_DriverId, dev, delta, cb);
    };

    detach = (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        if (!this.status()) return cb(new Error("Driver is Offline"));
        this.App.API.Driver.Detach(this.InApp_DriverId, dev, cb);
    };

    load = (cb: Callback) => {
        if (this.Loaded) {
            return cb(undefined, true);
        } else {
            this.App.API.Driver.Load(this.InApp_DriverId, (err, result) => {
                if (!err && result) this.Loaded = true;
                return cb(err, this.Loaded);
            });
        }
    };

    unload = (cb: Callback) => {
        if (!this.Loaded) {
            return cb(undefined, true);
        } else {
            this.App.API.Driver.Unload(this.InApp_DriverId, (err, result) => {
                if (!err && result) this.Loaded = false;
                return cb(err, result);
            });
        }
    };

    invoke = (device:IDevice, actionId, params, cb) => {
        if (!this.status()) return cb(new Error("Driver is Offline"));
        this.App.API.Driver.Invoke(this.InApp_DriverId, device, actionId, params, cb);
    };

}

export = InAppDriver;
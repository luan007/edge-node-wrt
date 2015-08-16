var HFPService: IInAppDriver = {

    match: (dev: IDevice, delta, cb: Callback) => {
        //IpAddress is required
        console.log("HFP Service is being Called");
        return cb(undefined, false);
    },

    attach: (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        cb(undefined, undefined);
    },

    change: (dev: IDevice, delta: IDriverDetla, cb: PCallback<IDeviceAssumption>) => {
        cb(undefined, undefined);        
    },

    detach: (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        return cb(undefined, { valid: true });
    },

    load: (cb: Callback) => {
        //Core.Router.Network.dnsmasq.Hosts[this._key] = this._name_cache; //no clash
        return cb(undefined, true);
    },

    unload: (cb: Callback) => {
        return cb();
    },

    invoke: (dev, actionId, params, cb) => {
        return cb();
    }

}

export = HFPService;
function _think(dev: IDevice, cb){
    if(!(dev.data.HFP.Interfaces && dev.data.HFP.Interfaces.length > 0)) return cb(undefined, undefined); //give up on this
    if(!(!dev.data.HFP.Online)) return cb(undefined, { valid: false }); //invalidate myself
    
    var assump = {
        classes: {
            'mobile': "" //might be incorrect
        },
        actions: {
        },
        aux: {},
        attributes: {
            
        },
        valid: true
    };
    
    cb(undefined, assump);
}

var HFPService: IInAppDriver = {

    match: (dev: IDevice, delta, cb: Callback) => {
        return cb(undefined, dev.data.HFP.Interfaces && dev.data.HFP.Interfaces.length > 0);
    },

    attach: (dev: IDevice, delta, matchResult: any, cb: PCallback<IDeviceAssumption>) => {
        _think(dev, cb);
    },

    change: (dev: IDevice, delta: IDriverDetla, cb: PCallback<IDeviceAssumption>) => {
        _think(dev, cb);
    },

    detach: (dev: IDevice, delta, cb: PCallback<IDeviceAssumption>) => {
        return cb(undefined, { valid: false });
    },

    load: (cb: Callback) => {
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
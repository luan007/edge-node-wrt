function _think(dev: IDevice, cb){
    if(!(dev.data.HFP.Interfaces && dev.data.HFP.Interfaces.length > 0)) return cb(undefined, undefined); //give up on this
    if(!dev.data.HFP.Online || dev.data.HFP.Type !== "hfp" ) return cb(undefined, { valid: false }); //invalidate myself
    
    var attr = <any>{};
    var HFP = dev.data.HFP;
    
    if(HFP.Name) attr.name = HFP.Name;
    if(HFP.Calls) attr["mobile.calls"] = HFP.Calls;
    if(HFP.NetworkRegistration && HFP.NetworkRegistration) {
        attr["mobile.baseband"] = HFP.NetworkRegistration;
        attr["signal"] = HFP.NetworkRegistration.Strength;
    }
    if(HFP.HandsFree && HFP.HandsFree.BatteryChargeLevel) attr["powerlevel"] = HFP.HandsFree.BatteryChargeLevel * 50;
    if(HFP.NetworkRegistration) attr["mobile.baseband"] = HFP.NetworkRegistration;
    
    var assump = {
        classes: {
            'mobile': "" //might be incorrect
        },
        actions: {
            "dial": !!HFP.VoiceCallManager,
            "hangup": !!HFP.VoiceCallManager,
            "pickup": !!HFP.VoiceCallManager,
        },
        aux: {},
        attributes: attr,
        valid: true
    };
    
    cb(undefined, assump);
}

var HFPService: IInAppDriver = {

    match: (dev: IDevice, delta, cb: Callback) => {
        return cb(undefined, dev.data.HFP.Type === "hfp" && dev.data.HFP.Interfaces && dev.data.HFP.Interfaces.length > 0);
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
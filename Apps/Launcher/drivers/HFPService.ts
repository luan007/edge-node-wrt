function _think(dev: IDevice, cb){
    if(!(dev.bus.data.HFP.Interfaces && dev.bus.data.HFP.Interfaces.length > 0)) return cb(undefined, undefined); //give up on this
    if(!dev.bus.data.HFP.Online || dev.bus.data.HFP.Type !== "hfp" ) return cb(undefined, { valid: false }); //invalidate myself
    
    var attr = <any>{};
    var HFP = dev.bus.data.HFP;
    
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
        return cb(undefined, dev.bus.data.HFP.Interfaces && dev.bus.data.HFP.Interfaces.length > 0);
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
        console.log("Entering Invokation Logic");
        if(!dev.bus.data.HFP || !dev.bus.data.HFP.Path) {
            return cb(new Error("HFP Error - data path not found"));
        }
        var pth = dev.bus.data.HFP.Path;
        switch(actionId){
            case "dial":
                API.Edge.HFP.Dial(pth, params.phoneNo, 'default', cb);
            break;
            
            case "hangup":
                API.Edge.HFP.HangupAll(pth, cb);
            break;
            
            case "pickup":
                var calls = dev.bus.data.HFP;
                if(!calls) return cb(new Error("Nothing to pickup!"));
                for(var i in calls){
                    if(calls[i].State === "incoming"){
                        return API.Edge.HFP.AnwserCall(i, cb)
                    }
                }
                return cb(new Error("Nothing to pickup!"));
            break;
            
            default:
                return cb(new Error(actionId + " is unknown"));
            break;
        }
        
    }

}

export = HFPService;
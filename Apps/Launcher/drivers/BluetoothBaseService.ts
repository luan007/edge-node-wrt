function _think(dev: IDevice, cb){
    
    var attr = <any>{};
    var data = dev.bus.data;
    
    if(data.Alias) attr.name = data.Alias;
    if(data.Name) attr.name = data.Name;
    if(data.rssi) attr.signal = Math.max(100, (Math.min(0, 100 + data.rssi)));
    if(data.RSSI) attr.signal = Math.max(100, (Math.min(0, 100 + data.RSSI)));
    
    //TODO: Get class by reading Icon + Class
    var assump = {
        classes: {},
        actions: {},
        aux: {},
        attributes: attr,
        valid: true
    };
    
    cb(undefined, assump);
}

var BluetoothBaseService: IInAppDriver = {

    match: (dev: IDevice, delta, cb: Callback) => {
        return cb(undefined, true);
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

export = BluetoothBaseService;
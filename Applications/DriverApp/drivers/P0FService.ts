//Resolve Device Name into DNS domains
//Also generates generic "name" if there's nothing set
//
class P0FService implements IInAppDriver {
    private MACDevices = {};

    constructor(){
        API.on('P0F.device', this.handleP0fDevice);
    }

    handleP0fDevice(device){
        this.MACDevices[device.hwaddr] = device;
        console.log('InAppDriver P0FService --->>>', device);
    }

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        cb(undefined, true);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        cb(undefined, {valid: true});
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        cb(undefined, {valid: true});
    }

    detach(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        cb(undefined, {valid: true});
    }

    load(cb:Callback) {
        return cb(undefined, true);
    }

    unload(cb:Callback) {
        return cb(undefined, true);
    }

    invoke(dev:IDevice, actionId, params, cb) {
        return cb(undefined, true);
    }

}

export var Instance = new P0FService();
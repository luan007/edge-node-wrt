var ipp = require('ipp');

class IPPService implements IInAppDriver {

  match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
  }

  attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
  }

  change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
  }

  detach(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
  }

  load(cb:Callback) {
  }

  unload(cb:Callback) {
  }

  invoke(dev:IDevice, actionId, params, cb) {
  }

}

export var Instance = new IPPService();
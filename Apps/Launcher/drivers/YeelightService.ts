class YeelightService implements IInAppDriver {

    private __toControl(R, G, B, L) {
        var str = R + "," + G + "," + B + "," + L + ",";
        for (var i = str.length; i < 18; i++) {
            str += ",";
        }
        return new Buffer(str);
    }

    private __disconnectThunk(address, cb) {
        return (err) => {
            API.Edge.Wireless.BTLE.Disconnect(address);
            if (err) return cb(err);
            return cb();
        };
    }

    private __analyzeLight(dev, cb) {
        var characteristics = dev.bus.data.characteristics;
        if (characteristics) {
            var classes:KVSet = {'light': ''};
            var actions:KVSet = {
                'adjust': '',
                'power': ''
            };
            var assump:KVSet = {};
            assump['light.color-on-off'] = characteristics.hasOwnProperty('fff1');
            assump['light.light-on-off'] = characteristics.hasOwnProperty('fff1');
            assump['light.delay-on-off'] = characteristics.hasOwnProperty('fff2') && characteristics.hasOwnProperty('fff3')
                && characteristics.hasOwnProperty('fff4');
            assump['light.status-query'] = characteristics.hasOwnProperty('fff5') && characteristics.hasOwnProperty('fff6');
            assump['light.color-flow'] = characteristics.hasOwnProperty('fff7');
            assump['light.LED-name'] = characteristics.hasOwnProperty('fff8') && characteristics.hasOwnProperty('fff9');
            if (characteristics.hasOwnProperty('fffc')) {
                assump['light.effect-setting'] = true;
                actions['set'] = '';
            }

            return cb(null, {
                classes: classes,
                actions: actions,
                aux: {},
                attributes: assump,
                valid: true
            });
        }
        return cb(new Error('unknown device'));
    }

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        console.log("--------------- Yeelight match Called");
        var matched = dev.bus.data.name && dev.bus.data.name.indexOf("Yeelight ") > -1;
        return cb(undefined, matched);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- Yeelight attach Called");
        this.__analyzeLight(dev, cb);
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- Yeelight change Called");
        this.__analyzeLight(dev, cb);
    }

    detach(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        return cb(undefined, true);
    }

    load(cb:Callback) {
        return cb(undefined, true);
    }

    unload(cb:Callback) {
        return cb(undefined, true);
    }

    invoke(dev:IDevice, actionId, params, cb) {
        var runtimekey = 'App_' + global.runtime_id + ':Yeelight';
        var assumption = dev.assumptions[runtimekey];

        if (assumption['actions'] && assumption['actions'].hasOwnProperty(actionId)) {
            var address = dev.bus.hwaddr;
            API.Edge.Wireless.BTLE.Connect(address, (err)=> {
                if (err) return cb(err);
                if (actionId === 'adjust') {
                    var color = this.__toControl(params.red, params.green, params.blue, params.brightness);
                    API.Edge.Wireless.BTLE.Write(address, "fff1", color, this.__disconnectThunk(address, cb));
                } else if (actionId === 'set') {
                    var effect = new Buffer(params.effect);
                    API.Edge.Wireless.BTLE.Write(address, "fffc", effect, this.__disconnectThunk(address, cb));
                } else if (actionId === 'power') {
                    var color = (params.flag === true) ? this.__toControl(255, 255, 255, 100) : this.__toControl(255, 255, 255, 0);
                    API.Edge.Wireless.BTLE.Write(address, "fff1", color, this.__disconnectThunk(address, cb));
                }
            });
        } else {
            return cb(new Error('current device does not support the action: ' + actionId));
        }
    }

}

export var Instance = new YeelightService();
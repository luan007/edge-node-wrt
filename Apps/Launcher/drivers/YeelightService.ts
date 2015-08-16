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
        var matched = dev.bus.data.name && dev.bus.data.name.indexOf("Yeelight ") > -1;
        return cb(undefined, matched);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        this.__analyzeLight(dev, cb);
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
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
                    API.Edge.Wireless.BTLE.Write(address, "fff1", color, cb);
                } else if (actionId === 'set') {
                    var effect = new Buffer(params.effect);
                    API.Edge.Wireless.BTLE.Write(address, "fffc", effect, cb);
                } else if (actionId === 'power') {
                    var color = (params.flag === true) ? this.__toControl(255, 255, 255, 100) : this.__toControl(255, 255, 255, 0);
                    API.Edge.Wireless.BTLE.Write(address, "fff1", color, cb);
                }
            });
        } else {
            return cb(new Error('current device does not support the action: ' + actionId));
        }
    }

}

export var Instance = new YeelightService();


//ERROR LOG
/*
Connecting to Perf
17:43:45.391 :API:FunctionExposer * Proxy.CurrentDevHeader
192.168.66.24 192.168.66.1 24
17:43:45.492 :Frontends:WebEX Web EX Call: driver.invoke
17:43:45.499 :Frontends:WebEX { '0': '"App_Launcher:Yeelight"',
  '1': '"9a917c50df924e55bba9c8822bfc8491"',
  '2': '"adjust"',
  '3': '{"red":255,"green":255,"blue":70,"brightness":100}' }
17:43:45.516 :API:FunctionExposer * Driver.Invoke
17:43:45.637 :API:FunctionExposer * Edge.Wireless.BTLE.Connect
Connecting to Perf
17:43:46.263 :Init [TypeError: Cannot read property 'stdin' of undefined]
TypeError: Cannot read property 'stdin' of undefined
    at L2capBle._queueCommand (/node_modules/noble/lib/linux/l2cap-ble.js:232:21)
    at L2capBle.exchangeMtu (/node_modules/noble/lib/linux/l2cap-ble.js:327:8)
    at nobleBindings.onConnect (/node_modules/noble/lib/linux/bindings.js:114:29)
    at emit (events.js:98:17)
    at L2capBle.onStdoutData (/node_modules/noble/lib/linux/l2cap-ble.js:98:12)
    at Socket.emit (events.js:95:17)
    at Socket.<anonymous> (_stream_readable.js:765:14)
    at Socket.emit (events.js:92:17)
    at emitReadable_ (_stream_readable.js:427:10)
    at emitReadable (_stream_readable.js:423:5)
17:43:46.335 :Init TypeError: Cannot read property 'stdin' of undefined
    at L2capBle._queueCommand (/node_modules/noble/lib/linux/l2cap-ble.js:232:21)
    at L2capBle.exchangeMtu (/node_modules/noble/lib/linux/l2cap-ble.js:327:8)
    at nobleBindings.onConnect (/node_modules/noble/lib/linux/bindings.js:114:29)
    at emit (events.js:98:17)
    at L2capBle.onStdoutData (/node_modules/noble/lib/linux/l2cap-ble.js:98:12)
    at Socket.emit (events.js:95:17)
    at Socket.<anonymous> (_stream_readable.js:765:14)
    at Socket.emit (events.js:92:17)
    at emitReadable_ (_stream_readable.js:427:10)
    at emitReadable (_stream_readable.js:423:5)
17:43:46.977 :Common:Native:commands sh /ramdisk/SYS/Scripts/Network/traffic.sh @1

 */
process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

require('./Env');

process.on('uncaughtException', function (err) {
    error(err);
    error(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    error(err);
    error(err.stack);
});

domain.run(function () {
    var modules = [
        './DB/Storage'
        , './DB/Registry'
        , './Device/Graphd/DB'
        , './Router/Network/Network'
        , './Router/Network/Firewall/Firewall'
        , './Router/Network/Firewall/TrafficAccountant'
        , './Router/Network/Wireless/Wifi'
        , './Router/Network/Wireless/Bluetooth'
        , './Device/Bus/WifiBus'
        , './Device/Bus/BluetoothBus'
        , './Device/DeviceManager'
        , './Device/DriverManager'
        , './Frontends/HttpProxy'
        , './API/Server'
        , './APP/RuntimePool'
        , './APP/Test/Deployment/Server'
    ];
    var initializes = [];
    var subscribes = [];
    for (var i = 0, len = modules.length; i < len; i++) {
        ((_i) => {
            var m = require(modules[_i]);
            if (m.Subscribe) {
                subscribes.push((cb) => {
                    m.Subscribe(cb);
                });
            }
            if (m.Initialize) {
                initializes.push((cb) => {
                    m.Initialize(cb);
                });
            }
        })(i);
    }

    //test cases
    var testModules = [
        './Router/Network/Firewall/__Test'
        , './Device/Graphd/__Test'
        , './Device/__Test'
        , './APP/Test/FakeData/Generator'
        , './APP/Resource/__Test'
    ];
    var tests = [];
    for (var i = 0, len = testModules.length; i < len; i++) {
        ((_i) => {
            var m = require(testModules[_i]);
            if (m.Initialize) {
                tests.push((cb) => {
                    m.Initialize(cb);
                });
            }
        })(i);
    }

    async.series(subscribes.concat(initializes).concat(tests), (err) => {
        fatal('========>>> entire series executed, then daemon.');
        if (err) {
            SYS_TRIGGER(SYS_EVENT_TYPE.ERROR, err);
            if (err) error(err);
        } else {
            fatal('SYS LOADED');
            SYS_TRIGGER(SYS_EVENT_TYPE.LOADED, err);
        }
    });

});
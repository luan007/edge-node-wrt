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

var diagnostic_report = [];
function Success(moduleName) {
    if (diagnostic_report.indexOf(moduleName) === -1)
        diagnostic_report.push(moduleName);

    intoQueue('write_diagnostic', (cb) => {
        require('fs').writeFile(CONF.DIAGNOSTIC_PATH, diagnostic_report.join('\n'), ()=> {});
        cb();
    }, () => {
    });
}

domain.run(function () {
    var modules = [
        {path: './DB/Storage', name: 'Storage'}
        , {path: './DB/Registry', name: 'Registry'}
        , {path: './Device/Graphd/DB', name: 'Graphd'}
        , {path: './Router/Storage/Samba', name: 'Samba'}
        //, {path: './Router/Storage/Obex', name: 'Obex'}
        , {path: './Router/Network/Network', name: 'Dnsmasq'}
        , {path: './Router/Network/Firewall/Firewall', name: 'IPtables'}
        , {path: './Router/Network/Firewall/TrafficAccountant', name: 'TrafficAccountant'}
        , {path: './Router/Network/Wireless/Wifi', name: 'Hostapd'}
        , {path: './Router/Network/Wireless/Bluetooth', name: 'Bluetooth'}
        , {path: './Device/Bus/WifiBus', name: 'WifiBus'}
        , {path: './Device/Bus/BluetoothBus', name: 'BluetoothBus'}
        , {path: './Device/DeviceManager', name: 'DeviceManager'}
        , {path: './Device/DriverManager', name: 'DriverManager'}
        , {path: './API/Server', name: 'APIServer'}
        , {path: './Frontends/MainUI', name: 'MainUI'}
        , {path: './Frontends/HttpProxy', name: 'HttpProxy'}
        , {path: './APP/Remote/Client', name: 'OrbitClient'}
        , {path: './APP/Test/FakeData/Generator'}
        , {path: './APP/Test/Deployment/Server'}
        , {path: './APP/RuntimePool', name: 'RuntimePool'}
        //, {path: './Router/Network/Firewall/__Test'}
        //, {path: './Device/Graphd/__Test'}
        //, {path: './Device/__Test'}
        //, {path: './APP/Resource/__Test'}
        , {path: './APP/__Test'}
    ];
    var initializes = [];
    var subscribes = [];
    for (var i = 0, len = modules.length; i < len; i++) {
        ((_i) => {
            var m = require(modules[_i].path);
            var name = modules[_i]['name'];
            if (m.Subscribe) {
                subscribes.push((cb) => {
                    m.Subscribe(cb);
                });
            }
            if (m.Initialize) {
                initializes.push((cb) => {
                    m.Initialize(() => {
                        if (m.Diagnose && name) {
                            m.Diagnose((err, status)=> {
                                console.log('who diagnose:', name, 'err', err, 'status:', status);
                                if (err) {
                                    return error(name + ' error: \n' + err.message);
                                }
                                if (!status) return error('module was corrupted:', name);
                                Success(name);
                            });
                        }
                        cb();
                    });
                });
            }
        })(i);
    }

    async.series(subscribes.concat(initializes), (err) => {
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
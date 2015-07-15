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
        {path: './Common/Runtime/Connectivity'} ,
        {path: './DB/Storage', name: 'Storage'}
        , {path: './DB/Registry', name: 'Registry'}
        , {path: './Device/Graphd/DB', name: 'Graphd'}
        , {path: './Device/Bus/WifiBus', name: 'WifiBus'}
        , {path: './Device/Bus/BluetoothBus', name: 'BluetoothBus'}
        , {path: './Device/DeviceManager', name: 'DeviceManager'}
        , {path: './Device/DriverManager', name: 'DriverManager'}
        , {path: './Router/Storage/Samba', name: 'Samba'}
        //, {path: './Router/Storage/Obex', name: 'Obex'}
        , {path: './Router/Network/Network', name: 'Dnsmasq'}
        , {path: './Router/Network/Firewall/Firewall', name: 'IPtables'}
        , {path: './Router/Network/Firewall/TrafficAccountant', name: 'TrafficAccountant'}
        , {path: './Router/Network/Wireless/Wifi', name: 'Hostapd'}
        , {path: './Router/Network/Wireless/Bluetooth', name: 'Bluetooth'}
        , {path: './API/Server', name: 'APIServer'}
        , {path: './API/TokenManager'}
        , {path: './Frontends/MainUI', name: 'MainUI'}
        , {path: './Frontends/HttpProxy', name: 'HttpProxy'}
        //, {path: './Frontends/HttpProxy', name: 'HttpProxy'}
        , {path: './APP/Test/FakeData/Generator'}
        , {path: './APP/Test/Deployment/Server'}
        , {path: './APP/RuntimePool', name: 'RuntimePool'}
        , {path: './APP/Resource/IO/FIFO'}
        , {path: './APP/Resource/FileSystem/Limit'}
        , {path: './APP/Resource/Ports/Redirector'}
        , {path: './APP/Resource/Ports/Tracker'}
        , {path: './APP/Resource/AppConfig'}
        //, {path: './Router/Network/Firewall/__Test'}
        //, {path: './Device/Graphd/__Test'}
        //, {path: './Device/__Test'}
        //, {path: './APP/Resource/__Test'}
        //, {path: './APP/__Test'}
        //, {path: './Common/System/__Test'}
        //, {path: './Common/Native/__Test'}
        //, {path: './Frontends/__Test'}
    ];
    var initializes = [];
    var subscribes = [];
    var cleanups = [];

    for (var i = 0, len = modules.length; i < len; i++) {
        ((_i) => {
            var m = require(modules[_i].path);
            var name = modules[_i]['name'];
            if (m.Diagnose && name) {
                RegisterModule(name);
            }
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
                                console.log('who diagnose:'['magentaBG'].bold, name, 'err', err, 'status:', status);
                                if (err) {
                                    ReportModuleFailed(name);
                                    return error(name + ' error: \n' + err.message);
                                }
                                if (!status) {
                                    ReportModuleFailed(name);
                                    return error('module was corrupted:', name);
                                }
                                ReportModuleSuccess(name);
                            });
                        }
                        cb();
                    });
                });
            }
        })(i);
    }

    cleanups.push((cb) => {
        ClearDiagnostic();
        ClearRuntimePID();
        cb();
    });

    async.series(cleanups.concat(subscribes.concat(initializes)), (err) => {
        fatal('========>>> entire series executed, then daemon.');
        if (err) {
            SYS_TRIGGER(SYS_EVENT_TYPE.ERROR, err);
            if (err) error(err);
        } else {
            fatal('SYS LOADED');
            SYS_TRIGGER(SYS_EVENT_TYPE.LOADED, err);
        }
    });

    function ClearRuntimePID() {
        if (fs.existsSync(CONF.APP_PID_FILE)) {
            var pids = fs.readFileSync(CONF.APP_PID_FILE);
            try {
                pids = JSON.parse(pids);
                for (var i = 0, len = pids.length; i < len; i++) {
                    console.log('killing -------------- >>', pids[i]);
                    exec('kill', '-9', pids[i]);
                }

            } catch (err) {
                console.log(err);
            }

            fs.unlinkSync(CONF.APP_PID_FILE);
        }
    }
});
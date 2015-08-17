require('./Env');

eval(LOG("Init"));

process.on('uncaughtException', function (err) {
    fatal(err);
    fatal(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    fatal(err);
    fatal(err.stack);
});

domain.run(function () {
    var pub = StatMgr.Pub(SECTION.LOADER, {
        modules: {}
    });

    var modules = [
        {path: './Common/Runtime/Connectivity', name: 'Connectivity'},
        {path: './DB/Storage', name: 'Storage'}
        , {path: './DB/Registry', name: 'Registry'}
        , {path: './Device/Graphd/DB', name: 'Graphd'}
        , {path: './Device/Bus/WifiBus', name: 'WifiBus'}
        , {path: './Device/Bus/Dummy', name: 'DummyBus'}
        , {path: './Device/Bus/BluetoothBus', name: 'BluetoothBus'}
        , {path: './Device/Bus/BTLE', name: "BTLEBus"}
        , {path: './Device/DeviceManager', name: 'DeviceManager'}
        , {path: './Device/DriverManager', name: 'DriverManager'}
        , {path: './Router/Network/Network', name: 'Network'}
        , {path: './Router/Network/Firewall/Firewall', name: 'IPtables'}
        , {path: './Router/Network/Firewall/TrafficAccountant', name: 'TrafficAccountant'}
        , {path: './Router/Network/Wireless/Wifi', name: 'Hostapd'}
        , {path: './Router/Network/Wireless/Bluetooth', name: 'Bluetooth'}
        , {path: './Router/Network/Wireless/BTLE', name: "BTLE"}
        , {path: './Router/Storage/Samba', name: 'Samba'}
        , {path: './Router/Storage/Obex', name: 'Obex'}
        , {path: './Router/Presentation/Streaming', name: 'Streaming'}
        , {path: './API/Server', name: 'APIServer'}
        , {path: './API/TokenManager', name: 'TokenManager'}
        , {path: './Frontends/MainUI', name: 'MainUI'}
        , {path: './Frontends/GUIProxy', name: 'GUIProxy'}
        , {path: './Frontends/HttpProxy', name: 'HttpProxy'}
        , {path: './Frontends/WebEX', name: 'WebEX'}
        , {path: './Frontends/Thirdparty', name: 'Thirdparty'}
        , {path: './Frontends/MsgManager', name: 'MsgManager'}
        , {path: './APP/RuntimePool', name: 'RuntimePool'}
        , {path: './APP/Resource/Shared/OUI', name: 'OUI'}
        , {path: './APP/Resource/Shared/Brand', name: 'Brand'}
        , {path: './APP/Resource/IO/FIFO', name: 'FIFO'}
        , {path: './APP/Resource/FileSystem/Limit', name: 'Limit'}
        , {path: './APP/Resource/Ports/Redirector', name: 'Redirector'}
        , {path: './APP/Resource/Ports/Tracker', name: 'Tracker'}
        , {path: './APP/Resource/AppConfig', name: 'AppConfig'}
        , {path: './Debug/FakeData/Generator', name: 'Generator'}
        , {path: './Debug/Deployment/Server', name: 'Server'}
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
                    var start:any = new Date();
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
                        if (name) {
                            var now:any = new Date();
                            var totalSeconds = (now - start) / 1000;
                            pub.modules.Set(name, totalSeconds);
                            console.log('[' + name +  '] total seconds:'['magentaBG'].bold, totalSeconds);
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
        info('========>>> entire series executed, then daemon.');
        if (err) {
            SYS_TRIGGER(SYS_EVENT_TYPE.ERROR, err);
            if (err) error(err);
        } else {
            info('SYS LOADED');
            SYS_TRIGGER(SYS_EVENT_TYPE.LOADED, err);
        }
    });
});


SYS_ON(SYS_EVENT_TYPE.ERROR, (err)=>{
    error("***********************SYSTEM ERROR*********************");
    error(err);
});
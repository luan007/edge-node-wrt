import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import DeviceManager = require('./DeviceManager');
import Bus = require('./Bus/Bus');
import CML = require('./CML');

function fakeDevice(mac, assumptions, cb) {
    DeviceManager.Events.on('up', (id, dev)=> {
        if (dev.bus.hwaddr === mac) {
            DeviceManager.Devices()[id].assumptions[id] = assumptions; //mock
            //console.log('fake device UP', DeviceManager.Devices()[id]);
            cb();
        }
    });

    var fakeDevice = new Bus('FAKE');
    fakeDevice.DeviceUp(mac, {
        Addr: mac,
        Band: 'FAKE',
        Alias: 'Galaxy S5'
    });
}

export function Initialize(cb) {
    console.log('============>>> device: CML testing...'['greenBG'].bold);

    async.series([
        (cb) => {
            fakeDevice('00:11:22:33:44:55', {
                classes: {
                    printer: {},
                    speaker: {}
                },
                actions: {
                    print: {},
                    play_audio: {}
                },
                attributes: {
                    dummyAttr: {
                        value: 1
                    }
                }
            }, cb);
        }
        , (cb)=> {
            fakeDevice('33:44:55:66:77:88', {
                classes: {
                    speaker: {}
                },
                actions: {
                    play_audio: {}
                },
                attributes: {
                    dummyAttr: {
                        value: 1
                    }
                }
            }, cb);
        }
    ], ()=> {
        CML.Query({
            and: [
                {
                    bus: {
                        'data.Alias': /Galaxy/
                    }
                }
            ]
        }, (err, result) => {
            if (err) error('CML error...', err);
            else console.log('CML results'['greenBG'].bold, result);
        });
    });

    cb();
}
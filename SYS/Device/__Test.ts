import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../Common/Stat/StatMgr');
import DeviceManager = require('./DeviceManager');
import Bus = require('./Bus/Bus');
import CML = require('./CML');

function fakeDevice(mac, assumptions, cb) {
    DeviceManager.Events.on('up', (id, dev)=> {
        if (dev.bus.hwaddr === mac) {
            DeviceManager.Devices()[id].assumptions[id] = assumptions; //mock
            console.log('fake device UP', DeviceManager.Devices()[id]);
            cb();
        }
    });

    var fakeDevice = new Bus('FAKE');
    fakeDevice.DeviceUp(mac, {
        Addr: mac,
        Band: 'FAKE'
    });
}

export function Initialize(cb) {
    fatal('============>>> device: CML testing...');

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
                //{
                //    can: /play/
                //},
                //{
                //    is: 'speaker'
                //},
                //{
                //    attr: ['dummyAttr']
                //}

                {
                    bus: {
                        'data.Alias': /Galaxy/
                    }
                }




                //{
                //    attr: {
                //        $: {
                //            tag: 'dummy'
                //        },
                //        expand: true, //full (das) auto
                //        depth: -1
                //    }
                //}
            ]
        }, (err, result) => {
            if (err) error('CML error...', err);
            else fatal('CML results', result);
        });
    });

    cb();
}
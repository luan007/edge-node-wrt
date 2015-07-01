import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../Common/Stat/StatMgr');
import DeviceManager = require('./DeviceManager');
import DriverManager = require('./DriverManager');
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

export function Subscribe(cb) {
    DriverManager.Events.on('change', (dev, drv, assumption?)=> {
        console.log('received change'['greenBG'].bold);
        if (assumption && assumption.classes && assumption.classes.hasOwnProperty('printer')
            && assumption.actions && assumption.actions.hasOwnProperty('print')) {
            console.log('received ipp printer change events'['greenBG'].bold, assumption);
            var params = <any>{
                uri: 'https://tools.ietf.org/pdf/rfc2911.pdf',
                mime_type: 'application/pdf',
                job_name: 'Job-1'
            };
            params.user = { name: 'Admin' };
            DriverManager.DriverInvoke(drv, dev, 'print', params, (err)=> {
                if (err) return error('print occurs error:', err);
                else return console.log('print success'['greenBG'].bold);
            });
        }
    });
    cb();
}
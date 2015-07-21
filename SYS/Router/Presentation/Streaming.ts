import Airplay = require('../../Common/Native/airplay');
import AirplayEvents = Airplay.Events;
import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;

var pub = StatMgr.Pub(SECTION.STREAMING, {
    Airplay: {}
});

class Configuration extends Configurable {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, original, cb) => {
        var reload = false;
        if (has(delta, "Airplay")) {
            for (var k in delta.Airplay) {
                if(delta.Airplay[k] === -1){
                    Airplay.Remove(k);
                    continue;
                }
                var server = Airplay.Get(k);
                if(!server) {
                    server = <any>Airplay.Add(k, ConfMgr.Get(SECTION.NETWORK).RouterIP, 'IMG');
                }
                if(<any>server + 0 <= 0) {
                    continue; //something went wrong
                }
                if(delta.Airplay[k] === 1){
                    Airplay.Start(k);
                }
                if(delta.Airplay[k] === 0){
                    Airplay.Stop(k);
                }
            }
        }
        if (has(delta, "Airtunes")) {
            for (var k in delta.Airtunes) {
                if(delta.Airplay[k] === -1){
                    Airplay.Remove(k);
                    continue;
                }
                var server = Airplay.Get(k);
                if(!server) {
                    server = <any>Airplay.Add(k, ConfMgr.Get(SECTION.NETWORK).RouterIP, 'AUD');
                }
                if(<any>server + 0 <= 0) {
                    continue; //something went wrong
                }
                if(delta.Airtunes[k] === 1){
                    Airplay.Start(k);
                }
                if(delta.Airtunes[k] === 0){
                    Airplay.Stop(k);
                }
            }
        }
        process.nextTick(cb);
    }
}

var defaultConfig = {
    Airplay: {
        "edge": 1  // 1 for started, 0 for stopped, -1 mark for removal
    },
    Airtunes: {
        "edge-tunes": 1  // 1 for started, 0 for stopped, -1 mark for removal
    }
};

export function Initialize(cb) {
    info('[[[ Streaming ]]] Initialize');

    //rewiring
    AirplayEvents.on('add', (name) => {
        //pub.Airplay.Set(name, {});
    });

    AirplayEvents.on('state', (name, state) => {
        pub.Airplay.Set(name, state);
    });

    AirplayEvents.on('del', (name) => {
        pub.Airplay.Del(name);
    });

    var configStreaming = new Configuration(SECTION.STREAMING, defaultConfig);
    configStreaming.Initialize(cb);
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.NETWORK);
    sub.network.on('RouterIP', (oldValue, newValue) => {
        Airplay.SetIP(newValue);
    });
    cb();
}

export function Diagnose(callback:Callback) {
    return callback();
}
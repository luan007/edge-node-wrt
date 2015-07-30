eval(LOG("Router:Storage:Obex"));

import ConfMgr = require('../../Common/Conf/ConfMgr');
import _Config = require('../../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
//import Registry =  require('../../DB/Registry');
import obex = require('../../Common/Native/obex');

var pub = StatMgr.Pub(SECTION.OBEX, {
    files: {}
});
export var Obexd = new obex.Obexpushd();
var transfer_folder = path.join(CONF.USER_DATA_PATH, "FileTransfer");

Obexd.on("connection",(file: obex.ObexpushObject) => {

    //TODO: Split Users
    var curLen = 0;
    var n = file.Properties.Name;
    var c = n;
    var co = 0;
    while (fs.existsSync(path.join(transfer_folder, c))) {
        c = n.split(".")[0] + "(" + (co++) + ")" + n.substr(n.split(".")[0].length);
    }
    var f = path.join(transfer_folder, c);
    trace(f);
    var stream = fs.createWriteStream(f);
    file.on("data",(buf) => {
        curLen += buf.length;
        stream.write(buf);
    });
    file.on("end",() => {
        stream.end();
        stream.close();
        if (curLen != file.Properties.Length) {
            fs.unlinkSync(f);
            warn("Broken file / Canceled!");
        }
        exec("chmod", "666", f);
    });
    file.on("error",(err) => {
        stream.end();
        stream.close();
        fs.unlinkSync(f);
        error(err);
    });
    file.Accept();
});

class Configuration extends Configurable {

    constructor(moduleName:string, defaultConfig:any) {
        super(moduleName, defaultConfig);
    }

    _apply = (delta, original, cb) => {
        if(has(delta, 'OBEXPush')){
            if(delta.OBEXPush.Enabled){
                Obexd.Start(true);
            }
        }
        cb();
    }
}

var defaultConfig = {
    OBEXPush: {
        Enabled: true
    }
};

export function Initialize(cb) {
    info('[[[ Obex ]]] Initialize');
    var configObex = new Configuration(SECTION.OBEX, defaultConfig);
    configObex.Initialize(cb);
}

export function Diagnose(callback:Callback) {
    setTask('stability_check_obex', ()=> {
        Obexd.StabilityCheck((err, stable)=> {
            if (err) return callback(err);
            return callback(null, stable);
        });
    }, 2000);
}
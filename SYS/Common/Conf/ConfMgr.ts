import fs = require('fs');
import path = require('path');
import events = require('events');
import _Config = require('./Config');
import Config = _Config.Config;

class ConfMgr extends events.EventEmitter {
    public CONFIG_PATH = CONF.CONFIG_PATH;

    private _configs:{ [key: string]: KVSet; } = {};
    private _handlers:{ [key: string]: Config; } = {};
    private _buffers:KVSet = {};
    private _transients:KVSet = {}; // APP only

    constructor() {
        super();

        this.on('flush', (key:string) => {
            this._flush(key);
        });
    }

    Register = (k:string, config) => {
        this._configs[k] = config;
        this._handlers[k] = new Config(k);
        return this._handlers[k];
    }

    Set = (k:string, conf:KVSet) => {
        if (!this._buffers[k]) this._buffers[k] = {};
        for (var c in conf) {
            if (!this._equal(conf[c], this._configs[k][c])) { // delta
                this._buffers[k][c] = conf[c];
            }
        }
    }

    AppSet = (k:string, appUid:string, conf:KVSet) => { // [moduleName][appUid]
        if (!this._transients[k]) this._transients[k] = {};
        if (!this._transients[k][appUid]) this._transients[k][appUid] = {};
        for (var c in conf) {
            this._transients[k][appUid][c] = conf[c];
        }
    }

    AppShut = (k:string, appUid:string) => { // [moduleName][appUid]
        if (!this._transients[k]) this._transients[k] = {};
        this._transients[k][appUid] = {
            Recycle: true
        };
    }

    Commit = () => {
        var delta = {};

        for (var k in this._buffers) {
            delta[k] = this._buffers[k];
        }

        for (var k in this._transients) { // [moduleName]['APP'][appUid]
            for (var appUid in this._transients[k]) {
                for(var key in this._transients[k][appUid]){
                    if (!delta[k]) delta[k] = {};
                    if (!delta[k]['APP']) delta[k]['APP'] = {};
                    if (!delta[k]['APP'][appUid]) delta[k]['APP'][appUid] = {};
                    delta[k]['APP'][appUid][key] = this._transients[k][appUid][key];
                }
            }
        }

        for(var moduleName in delta){
            this._handlers[moduleName].emit('commit', delta[moduleName], this._configs[moduleName], ()=> {
            });
        }

        //for (var k in this._buffers) {
        //    if (this._handlers[k]) {
        //        var delta = _.clone(this._buffers[k]);
        //        if (this._transients[k]) { // mixin _buffers and APP _transients conf.
        //            for (var key in this._transients[k]) {
        //                if (!has(delta, key)) {
        //                    delta[key] = this._transients[k][key];
        //                }
        //            }
        //        }
        //        this._handlers[k].emit('commit', delta, this._configs[k], ()=> {
        //        });
        //    }
        //}
    }

    Initialize = () => {
    }

    Destory = () => {
        this.removeAllListeners();
    }

    Get = (key):any => {
        if (key && !this._configs[key])
            this._load(key);
        return this._configs[key];
    }

    GetAll:any = () => {
        return this._configs;
    }

    private _equal = (a, b) => {
        var ta = typeof a,
            tb = typeof b;
        if ((ta === 'number' || ta === 'string') && (tb === 'number' || tb === 'string'))
            return a == b;
        return false;
    }

    private _flush = (key) => {
        if (this._buffers[key]) {

            this.emit('changed', key, this._buffers[key], this._configs[key]);

            for (var k in this._buffers[key]) {
                this._configs[key][k] = this._buffers[key][k];
            }

            delete this._buffers[key];
            this._save(key);
        }
    }

    private _filePath = (key) => {
        return path.join(this.CONFIG_PATH, key);
    }

    private _save = (key) => {
        intoQueue('write_config_' + key, () => {
            fs.writeFile(this._filePath(key), JSON.stringify(this._configs[key]), (err)=> {
                if (err) console.log(err);
            });
        }, () => {
            trace('write_config executed.', JSON.stringify(this._configs[key]), new Date().toLocaleTimeString());
        });
    }

    private _load = (key) => { // TODO: need bash to create CONFIG
        var filePath = this._filePath(key);
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
        var data = fs.readFileSync(filePath);
        this._configs[key] = JSON.parse(data.toString('utf8'));
    }
}

var confMgr = new ConfMgr();
export = confMgr;

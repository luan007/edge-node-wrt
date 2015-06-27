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

    AppRevoke = (k:string, appUid:string, cb) => { // [moduleName][appUid]
        if (!this._transients[k]) this._transients[k] = {};
        this._transients[k][appUid] = undefined;
        if(this._handlers[k])
            this._handlers[k].emit('recycle', appUid, cb);
    }

    Commit = () => {
        for (var k in this._buffers) {
            if(this._handlers[k])
                this._handlers[k].emit('commit', this._buffers[k], this._configs[k], ()=>{});
        }
    }

    CommitByAPP = (k, cb) => {
        var delta = {};

        if(this._transients[k]) { // [moduleName]['APP'][appUid]
            for (var appUid in this._transients[k]) {
                for(var key in this._transients[k][appUid]){
                    if (!delta[k]) delta[k] = {};
                    if (!delta[k]['APP']) delta[k]['APP'] = {};
                    if (!delta[k]['APP'][appUid]) delta[k]['APP'][appUid] = {};
                    delta[k]['APP'][appUid][key] = this._transients[k][appUid][key];
                }
            }
        }

        if(this._handlers[k])
            this._handlers[k].emit('commit', delta[k], this._configs[k], cb);
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
        console.log('received _flush key', key);
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
        intoQueue('write_config_' + key, (cb) => {
            fs.writeFile(this._filePath(key), JSON.stringify(this._configs[key]), (err)=> {
                if (err) console.log(err);
                cb();
            });
        }, () => {
            console.log('write_config executed.'['cyanBG'], JSON.stringify(this._configs[key]), new Date().toLocaleTimeString());
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

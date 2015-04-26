import fs = require('fs');
import events = require('events');
import _Config = require('./Config');
import Config = _Config.Config;

class ConfMgr extends events.EventEmitter {
    public CONFIG_PATH = CONF.CONFIG_PATH;

    private _configs:{ [key: string]: KVSet; } = {};
    private _handlers:{ [key: string]: Config; } = {};
    private _buffers:KVSet = {};

    constructor() {
        super();

        this.on('flush', (key:string) => {
            this._flush(key);
        });
    }

    Register = (k:string, conf:any) => {
        this._configs[k] = this._configs[k] || conf;
        this._handlers[k] = this._handlers[k] || new Config(k, conf);
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

    Commit = () => {
        for (var k in this._buffers) {
            this._handlers[k].emit('commit', this._buffers[k], this._configs[k]);
        }
    }

    Initialize = () => {
        this._load();
    }

    Destory = () => {
        this.removeAllListeners();
    }

    Get = (key?) => {
        return key ? this._configs : this._configs[key];
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
            this._save();
        }
    }

    private _save = () => {
        setTask('write_config', () => {
            trace('write_config executed.', new Date().toLocaleTimeString());
            fs.writeFile(this.CONFIG_PATH, JSON.stringify(this._configs), (err)=> {
                if (err) console.log(err);
            });
        }, CONF.CONFIG_DELAY);
    }

    private _load = () => { // TODO: need bash to create CONFIG
        var data = fs.readFileSync(this.CONFIG_PATH);
        this._configs = JSON.parse(data.toString('utf8'));
    }
}

var confMgr = new ConfMgr();
export = confMgr;

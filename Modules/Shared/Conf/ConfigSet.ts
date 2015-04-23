import events = require('events');

export class ConfigEvent {
    static Created:string = 'Created';
    static Changed:string = 'Changed';
    static Deleted:string = 'Deleted';
    static Reloaded:string = 'Reloaded';
    static ReloadFailed:string = 'ReloadFailed';
}

export class ConfigSet extends events.EventEmitter {
    private _configId: string;
    private _configs:{ [key: string]: string; } = {};

    constructor(configId: string) {
        super();

        this._configId = configId;
    }

    Set = (k, v) => {
        var evt = ConfigEvent.Created;
        var args = [v];
        if (this._configs[k]) {
            evt = ConfigEvent.Changed;
            args.unshift(this._configs[k]);
        }
        this._configs[k] = v;
        this.emit.apply(null, [evt].concat(args));
    };

    Delete = (k) => {
        if (this._configs[k]) {
            var evt = ConfigEvent.Deleted;
            this.emit.apply(null, [evt].concat(this._configs[k]));
            delete this._configs[k];
        }
    }

    Get = (k) => {
        return this._configs[k];
    }

    /**
     * (Re)Loads Config from DB
     * @delegate:
     */
    Reload = (delegate: (id:string, cb:(err, res) => void) =>void) => {
        delegate(this._configId, (err, res) => {
            if(err) {
                error(err);
                this.emit(ConfigEvent.ReloadFailed, err);
            }
            else{
                if(typeof res === 'string') res = JSON.parse(res);
                this._configs = res;
                this.emit(ConfigEvent.Reloaded);
            }
        });
    }
}
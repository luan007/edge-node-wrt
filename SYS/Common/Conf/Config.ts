import events = require('events');

export class Config extends events.EventEmitter {
    public key:string;
    public conf:any;

    constructor(key:string, conf:any) {
        super();

        this.key = key;
        this.conf = conf;

        this.on('commit', this.Apply);
    }

    Flush = () => {
        require('./ConfMgr').emit('flush', this.key);
    }

    Get = () => {
        return require('./ConfMgr').Get(this.key);
    }

    Error = (err) => {
        if (error) error(err);
        else console.log(err);
    }

    Destory = () => {
        this.removeAllListeners();
    }

    /**
     * Applies Delta to current config, triggers underlying _apply logic + emits change with mod (if there's any)
     * @param config_delta
     * @param plus Delta Object
     * @param override Defaults to TRUE
     */
    Apply = (config_delta, config_previous) => {
        intoQueue("_CONFIG_" + this.key, () => {
            var _backup = JSON.stringify(this.conf);
            trace("Applying.. [" + Object.keys(config_delta).length + "]");
            this._apply(config_delta, config_previous, (err) => {
                if (err) {
                    error(err);
                    this.conf = JSON.parse(_backup);
                    this.Reload(_backup, () => {
                        warn("Reloading last config..");
                    });
                } else {
                    for(var k in config_delta)
                        this.conf[k] = config_delta[k];
                    this.Flush();
                    trace(this.key, "Applied");
                }
            });
        }, ()=> {
        });
    };

    /**
     * (Re)Loads Config from DB
     */
    Reload = (_default, cb) => {
        var result = this.Get();
        if (!result || (CONF.IS_DEBUG && CONF.RELOAD_DEFAULT_CONFIG)) {
            if (_default) {
                trace("Data Absent.. going default");
                return this.Apply(_default, cb);
            } else {
                return cb();
            }
        }
        trace("Config (re)Loaded");
        this.Apply(result, cb);
    };

    /**
     * Virtual Method, to be implemented
     */
    protected _apply = (mod, raw, cb:Callback) => {
        throw new Error("Virtual Method");
    };
}
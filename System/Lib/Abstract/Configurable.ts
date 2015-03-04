import Node = require("Node");

export class Configurable extends Node.events.EventEmitter {

    private _config = <any>{};
        
    constructor(protected sub?: Subkey, protected key = "_config") {
        super();
        this.sub = sub;
        this.key = key;
    }

    SubLevel() {
        return this.sub;
    }

    Get() {
        return this._config;
    }

    /**
     * Applies Delta to current config, triggers underlying _apply logic + emits change with mod (if there's any)
     * @param config_delta
     * @param plus Delta Object
     * @param override Defaults to TRUE
     */
    Apply = (config_delta, cb) => {
        info(JSON.stringify(config_delta));
        intoQueue("_CONFIG_" + this.key,(cb) => {
            var _backup = JSON.stringify(this._config);
            var mod = delta_add_return_changes(this._config, config_delta, true);
            trace("Applying.. [" + Object.keys(mod).length + "]");
            this._apply(mod, config_delta, (err) => {
                if (err) {
                    error(err);
                    this._config = JSON.parse(_backup);
                    this.Reload(_backup,() => {
                        warn("Reloading last config..");
                    });
                    cb(err);
                } else {
                    this.emit("change", mod);
                    if (this.sub && this.key) {
                        return this.sub.put(this.key, this._config,(err) => {
                            if (err) error(err);
                            else info("Saved - " + JSON.stringify(this._config));
                            cb(err, mod);
                        });
                    } else {
                        cb(undefined, mod);
                    }
                    trace("Applied");
                }
            });
        }, cb);
    };
    
    /**
     * (Re)Loads Config from DB
     */
    Reload = (_default, cb) => {
        if (!(this.sub && this.key)) {
            return cb();
        }
        this.sub.get(this.key, (err, result) => {
            if (!result || err || (CONF.IS_DEBUG && CONF.RELOAD_DEFAULT_CONFIG)) {
                if (_default) {
                    trace("Data Absent.. going default");
                    return this.Apply(_default, cb);
                } else {
                    return cb(err);
                }
            }
            trace("Config (re)Loaded");
            this.Apply(result, cb);
        });
    };

    /**
     * Virtual Method, to be implemented
     */
    protected _apply = (mod, raw, cb: Callback) => {
        throw new Error("Virtual Method");
    };
    
}

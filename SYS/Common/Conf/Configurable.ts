import ConfMgr = require('./ConfMgr');
import _Config = require('./Config');
import Config = _Config.Config;

export class Configurable {
    public ConfigHandler:Config;

    constructor(key:string, conf:any) {
        this.ConfigHandler = ConfMgr.Register(key, conf);
        this.ConfigHandler.on('commit', this.Apply);
    }

    /**
     * Applies Delta to current config, triggers underlying _apply logic + emits change with mod (if there's any)
     * @param config_delta
     * @param plus Delta Object
     * @param override Defaults to TRUE
     */
    Apply = (config_delta, config_previous, cb) => {
        intoQueue("_CONFIG_" , (queue_cb) => {
            var _backup = JSON.stringify(this.ConfigHandler.conf);
            trace("Applying.. [" + Object.keys(config_delta).length + "]");
            this._apply(config_delta, config_previous, (err) => {
                if (err) {
                    error(err);
                    this.ConfigHandler.conf = JSON.parse(_backup);
                    this.Reload(_backup, () => {
                        warn("Reloading last config..");
                        queue_cb();
                    });
                } else {
                    for (var k in config_delta)
                        this.ConfigHandler.conf[k] = config_delta[k];
                    this.ConfigHandler.Flush();
                    trace(this.ConfigHandler.key, "Applied");
                    queue_cb();
                }
            });
        }, cb);
    };

    /**
     * (Re)Loads Config from DB
     */
    Reload = (_default, cb) => {
        var result = this.ConfigHandler.Get();
        if (!result || (CONF.IS_DEBUG && CONF.RELOAD_DEFAULT_CONFIG)) {
            if (_default) {
                trace("Data Absent.. going default");
                return this.Apply(_default, _default, cb);
            } else {
                return cb();
            }
        }
        trace("Config (re)Loaded");
        this.Apply(result, _default, cb);
    };

    Initialize = (cb) => { //TODO: supply default config
        var _default = this.ConfigHandler.Get();
        this.Reload(_default, cb);
    };

    /**
     * Virtual Method, to be implemented
     */
    protected _apply = (mod, raw, cb:Callback) => {
        throw new Error("Virtual Method");
    };
}
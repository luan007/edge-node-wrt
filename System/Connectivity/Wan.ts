import Node = require("Node");
import Core = require("Core");
import Native = Core.SubSys.Native;
import Iptables = Native.iptables;
import Abstract = Core.Lib.Abstract;

class _wan extends Abstract.Configurable {

    Default = {
        Mode : "DHCP" // WAN will become a stub when sets to PPPOE
    };

    constructor() {
        super();
    }

    protected _apply = (mod, cb: Callback) => {
        
    };

    public Initialize = (cb) => {
        this.sub = Core.Data.Registry.Sector(Core.Data.Registry.RootKeys.Network, "WAN");
        async.series([
            this.Reload.bind(null, this.Default)
        ], cb);
    };
}

var _export = new _wan();
export = _export;
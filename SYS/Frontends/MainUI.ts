import HttpProxy = require("./HttpProxy");
import url = require("url");
import Registry =  require('../DB/Registry');
import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import _Configurable = require('../Common/Conf/Configurable');
import Configurable = _Configurable.Configurable;
import AppManager = require('../APP/AppManager');
import RuntimePool = require('../APP/RuntimePool');
import UserManager = require('../User/UserManager');
import nginx = require('../Common/Native/nginx');

var LauncherMainPort;
var LauncherAuthPort;

export var PrefixTable = {
    //owner_id: [ prefix, dest ]
};
export var HostnameTable = {
    //owner_id: [ prefix, dest ]
};

function GetTarget(host: string, Uri: string, authenticated: string, cb) {
    var base = "";
    var cookie_affect_range = "/" + UUIDstr() + "/"; //safe heaven :p
    var uri = Uri;
    var host = host;
    var targetPrefix = "";
    //trace(host + " :: " + Uri);

    var hostsplit = host.toLowerCase().split(".");

    if (authenticated === "1") {

        cookie_affect_range = "";
        base = LauncherMainPort;

        if (hostsplit.length === 3) {
            var h = hostsplit[0];
            for (var i in HostnameTable) {
                var prefix = HostnameTable[i][0].toLowerCase();
                if (h == prefix) {
                    base = HostnameTable[i][1];
                    break;
                }
            }
        } else {
            var block1 = uri.split(/\?|\/|\#|\:/gmi)[1].toLowerCase();
            for (var i in PrefixTable) {
                var prefix = PrefixTable[i][0].toLowerCase();
                if (block1 == prefix) {
                    targetPrefix = prefix;
                    base = PrefixTable[i][1];
                    break;
                }
            }
            uri = uri.substr(targetPrefix.length);
        }
        //TODO: Add more logic here :)
    } else {
        trace(Uri);
        base = LauncherAuthPort;
        cookie_affect_range = "";
    }
    base = "http://unix:/" + base + ":";
    var result = base + uri;
    info(result);
    cb(undefined, [result, cookie_affect_range]);
}

function SetupLauncherPort(main, auth, cb) {
    var launcher = RuntimePool.GetCallingRuntime(this);
    if (!launcher) return cb(new Error("Who are you?"));

    LauncherMainPort = path.join(AppManager.GetRealAppDataDir(launcher.App.uid), main);
    LauncherAuthPort = path.join(AppManager.GetRealAppDataDir(launcher.App.uid), auth);
    trace("Main:" + LauncherMainPort);
    trace("Auth:" + LauncherAuthPort);

    async.series([
        exec.bind(null, "chown", "nobody", LauncherMainPort),
        exec.bind(null, "chown", "nobody", LauncherAuthPort)
    ], (err) => {
        cb(err);
    });
}

__API(GetTarget, "Proxy.GetTarget", nginx.NGINX_PERM_ARR);
__API(SetupLauncherPort, "Launcher.SetupPort", [Permission.Launcher]);

__API(function (atoken, cb) {
    if (!UserManager.DB_Ticket[atoken]) {
        cb(new Error());
    } else {
        cb(undefined, UserManager.DB_Ticket[atoken].owner_uid);
    }
}, "Proxy.AuthUser", nginx.NGINX_PERM_ARR);
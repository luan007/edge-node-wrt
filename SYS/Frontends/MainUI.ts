eval(LOG("Frontends:MainUI"));

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
import TokenManager = require('../API/TokenManager');

var LauncherMainPort;
var LauncherAuthPort;

export var PrefixTable = {
    //owner_id: [ prefix, dest ]
};
export var HostnameTable = {
    //owner_id: [ prefix, dest ]
};

function pushStack(obj, key, val) {
    //if (!has(obj, key)) {
        obj[key] = val;
    //}
}
function popStack(obj, key) {
    //if (has(obj, key)) {
        delete obj[key];
    //}
}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.RUNTIME);
    sub.apps.on('set', (appUid, oldStatus, newStatus) => {
        if (newStatus.AppUrl.trim() !== '' && newStatus.State > 1) {
            info('▂▃▅▆█ runtime pool apps set'['cyanBG'].bold, appUid, newStatus);
            var pair = [newStatus.AppUrl, newStatus.MainSock];
            pushStack(PrefixTable, newStatus.RuntimeId, pair);
            pushStack(HostnameTable, newStatus.RuntimeId, pair);
        }
        else if (newStatus.State <= 1) {
            popStack(PrefixTable, newStatus.RuntimeId);
            popStack(HostnameTable, newStatus.RuntimeId);
        }
    });
    sub.apps.on('del', (appUid, oldStatus) => {
        if (oldStatus.AppUrl.trim() !== '') {
            info('▂▃▅▆█ runtime pool apps set'['cyanBG'].bold, appUid, oldStatus);
            popStack(PrefixTable, oldStatus.RuntimeId);
            popStack(HostnameTable, oldStatus.RuntimeId);
        }
    });
    cb();
}

function GetTarget(host:string, Uri:string, authenticated:string, cb) {
    var base = "";
    var cookie_affect_range = "/" + UUIDstr() + "/"; //safe heaven :p
    var uri = Uri;
    var host = host;
    var targetPrefix = "";
    //trace(host + " :: " + Uri);

    var hostsplit = host.toLowerCase().split(".");

    if (authenticated === "1" || (CONF.IS_DEBUG && CONF.BYPASS_ALL_AUTH)) {

        cookie_affect_range = "";
        base = LauncherMainPort;

        info('HOST:');
        info(HostnameTable);
        info('PREFIX:');
        info(PrefixTable);

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
            uri = "/" + uri.substr(targetPrefix.length + 1);
            if(uri.indexOf("//") === 0) {
                uri = uri.substr(1);
            }
        }
        //TODO: Add more logic here :)
    } else {
        trace(Uri);
        base = LauncherAuthPort;
        cookie_affect_range = "";
    }
    base = "http://unix:/" + base + ":";
    var result = base + uri;
    //fatal('^_________^  GetTarget result:', result);
    cb(undefined, [result, cookie_affect_range]);
}

function SetupLauncherPort(main, auth, cb) {
    var launcher = RuntimePool.GetCallingRuntime(this);
    if (!launcher) return cb(new Error("Who are you?"));

    LauncherMainPort = path.join(AppManager.GetRealAppDataDir(launcher.App.uid), main);
    LauncherAuthPort = path.join(AppManager.GetRealAppDataDir(launcher.App.uid), auth);
    info("^_________^ Main:" + LauncherMainPort);
    info("^_________^ Auth:" + LauncherAuthPort);

    async.series([
        exec.bind(null, "chown", "nobody", LauncherMainPort),
        exec.bind(null, "chown", "nobody", LauncherAuthPort)
    ], (err) => {
        cb(err);
    });
}

function AuthUser(atoken, devid, cb) {
    if (!UserManager.DB_Ticket[atoken]) {
        cb(new Error());
    } else {
        var token_uid = TokenManager.Issue(atoken, UserManager.DB_Ticket[atoken].owner_uid,  devid);
        cb(undefined, token_uid);
        //cb(undefined, UserManager.DB_Ticket[atoken].owner_uid);
    }
}

__API(GetTarget, "Proxy.GetTarget", nginx.NGINX_PERM_ARR);
__API(SetupLauncherPort, "Launcher.SetupPort", [Permission.Launcher]);
__API(AuthUser, "Proxy.AuthUser", nginx.NGINX_PERM_ARR);
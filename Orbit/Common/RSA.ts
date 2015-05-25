var rsa:any = require("node-rsa");
import crypto = require('crypto');
import fs = require("fs");
import path = require("path");
import Data = require("../Storage");

function _Gen_Salt(len) {
    return crypto.randomBytes(len);
}

function _Gen_KeyPair(keylen?:number, exponent?:number) {
    keylen = keylen || 4096;
    exponent = exponent || 65537;

    var r = new rsa({b: keylen, e: exponent});
    return {
        privateKey: r.exportKey(),
        publicKey: r.exportKey('public')
    };
}
function _Hash_Directory(dir, salt) {
    var res = HashDir(dir, salt);
    console.log(" PBKDF2 .. KeyLength = " + res.length);
    return crypto.pbkdf2Sync(res, salt, 1000, 256);
}

/**
 *
 * @returns {{RouterPair: ({privateKey, publicKey}), AppPair: ({privateKey, publicKey})}}
 * @constructor
 */
export function GenKeyPairs() {
    var routerPair = _Gen_KeyPair(256);
    var appPair = _Gen_KeyPair(4096);

    return {
        RouterPair: routerPair,
        AppPair: appPair
    };
}
/**
 *
 @callback(err, result) :
 result: app_sig
 */
export function SignApp(routerId:string, app_uid:string, callback:Callback) {
    var keyname = 'app';
    console.log("Validating sig using " + keyname.bold);
    var appPath = path.join(ORBIT_CONF.APP_BASE_PATH, app_uid);
    if (!fs.existsSync(appPath)) {
        callback(new Error('app does not exist: ' + app_uid));
    }
    else {
        Data.Models.Router.Table.get(routerId, (err, router) => {
            if (err || !router)
                return callback(err);
            Data.Models.Application.Table.get(app_uid, (err, app) => {
                if (err || !app)
                    return callback(err);
                try {
                    var salt = _Gen_Salt(256);
                    var hash = _Hash_Directory(app_uid, salt);
                    var prvkey = new rsa(router.appkey);
                    var snapshot = salt.toString("hex") + hash.toString("hex");
                    var sign = prvkey.sign(snapshot, "hex", "utf8");
                    var app_sig = salt.toString("hex") + sign.toString();
                    return callback(null, app_sig);
                } catch (err) {
                    return callback(err);
                }
            });
        });
    }
}


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
export function SignApp(appKey:string, appPath:string) {
    var salt = _Gen_Salt(256);
    var hash =  HashDir(appPath, salt);
    var prvkey = new rsa(appKey);
    var snapshot = salt.toString("hex") + hash.toString("hex");
    var sign = prvkey.sign(snapshot, "hex", "utf8");
    var app_sig = salt.toString("hex") + sign.toString();
    return app_sig;
}

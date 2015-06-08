var rsa:any = require("node-rsa");
import crypto = require('crypto');
import fs = require("fs");
import path = require("path");
import Data = require("../Storage");

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

export function GenSalt(len) {
    return crypto.randomBytes(len);
}
/**
 *
 @callback(err, result) :
 result: app_sig
 */
export function SignApp(appKey:string, appPath:string) {
    var salt = GenSalt(256);
    var hash =  HashDir(appPath, salt);
    var pubkey = new rsa(appKey);
    var snapshot = salt.toString("hex") + hash.toString("hex");
    var sign = pubkey.sign(snapshot, "hex", "utf8");
    var app_sig = salt.toString("hex") + sign.toString();
    return app_sig;
}

/**
 *
 * @param appKey
 * @param dirHashCode
 * @returns {string}
 */
export function SignAppByHashCode(appKey:string, salt:Buffer, dirHashCode:string|Buffer) {
    var pubkey = new rsa(appKey);
    var snapshot = salt.toString("hex") + dirHashCode;
    var sign = pubkey.sign(snapshot, "hex", "utf8");
    var app_sig = salt.toString("hex") + sign.toString();
    return app_sig;
}

/**
 * need node-rsa 0.2.22
 * password: hex encoding
 */
export function EncryptAESPassword(appKey:string, password:string) {
    var key = new rsa(appKey);
    var encrypted = key.encryptPrivate(password, 'base64', 'hex');
    return encrypted;
}
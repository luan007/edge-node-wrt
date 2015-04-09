var rsa = require("node-rsa");
var forsake = require("forsake");
var fs = require("fs");
var path = require("path");
var temp_keystore = {};
function Unsafe_SyncRSAEncrypt_Fast(keyname, content) {
    var pem = undefined;
    if (temp_keystore[keyname] && (pem = temp_keystore[keyname].exportKey('public'))) {
        return forsake.encrypt(content, pem).toString("hex");
    }
    else {
        throw new Error("RSA key not found");
    }
}
function Safe_SyncRSAEncrypt_Fast(keyname, content, cb) {
    process.nextTick(function () {
        try {
            var result = Unsafe_SyncRSAEncrypt_Fast(keyname, content);
            return cb(undefined, result);
        }
        catch (e) {
            return cb(e);
        }
    });
}
function LoadPubkey(keyname, PEM) {
    try {
        var key = new rsa(PEM);
        if (!key.isPublic()) {
            throw new Error("Not a valid public key");
        }
        else {
            temp_keystore[keyname] = key;
        }
    }
    catch (e) {
        error("RSA Failuare! ".bold + e);
        error("PEM = " + PEM);
    }
}
function LoadFromFile(keyname) {
    warn("* Loading PEM (REMOVE THIS W/RTM V) " + keyname["magentaBG"].bold);
    var f = path.join(CONF.BASE_PATH, "Lib/Crypto/Keys/" + keyname + ".pb");
    if (!fs.existsSync(f)) {
        error("* PEM NOT FOUND " + keyname["redBG"].bold);
        return false;
    }
    else {
        var data = fs.readFileSync(f, 'utf8').toString();
        LoadPubkey(keyname, data);
        info("* GOT PEM " + keyname["greenBG"].bold);
        info("* KEY LENGTH = " + temp_keystore[keyname].getKeySize());
    }
}
function _RSA_Verify(keyname, sig, data) {
    trace("Validating sig using " + keyname.bold);
    if (!temp_keystore.hasOwnProperty(keyname)) {
        return false;
    }
    else {
        var rsa = temp_keystore[keyname];
        if (!rsa.isPublic()) {
            return false;
        }
        else {
            return rsa.verify(data, sig, "utf8", "hex");
        }
    }
}
function Initialize() {
    global.RSA_Verify = _RSA_Verify;
    global.Unsafe_SyncRSAEncrypt_Fast = Unsafe_SyncRSAEncrypt_Fast;
    global.Safe_SyncRSAEncrypt_Fast = Safe_SyncRSAEncrypt_Fast;
    trace("Temporary Public Key Store is UP");
    LoadFromFile("App");
    LoadFromFile("Router");
}
exports.Initialize = Initialize;

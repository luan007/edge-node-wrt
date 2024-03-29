﻿import crypto = require("crypto");

import uuid = require("uuid");

global.sha1 = function (content) {
    var hasher = crypto.createHash("sha1");
    hasher.update(content);
    return hasher.digest("base64");
}

global.sha256 = function (content) {
    var hasher = crypto.createHash("sha256");
    hasher.update(content);
    return hasher.digest("base64");
}

global.digest = function (content, key, rotation = 10) {
    var digest = key + sha256(content) + key;
    for (var i = 0; i < rotation; i++) {
        digest = key + sha256(digest) + key;
    }
    return sha256(digest);
}

global.randombuf = function (len = 64) {
    return crypto.randomBytes(len);
}

global.randomstr = function (len = 64, encoding = "base64") {
    return randombuf(len).toString(encoding);
}


global.hash = function (passkey: string, salt: string, callback: Callback) {
    crypto.pbkdf2(passkey, salt, 5000, 256,(err, key: any) => {
        callback(err, key.toString("base64"));
    });
};

global.generateToken = function () {
    var buf = new Buffer(32);
    uuid.v4(null, buf, 0);
    return buf.toString("hex");
};

global.generateSalt = function () {
    return crypto.randomBytes(512 / 8).toString("base64");
};




/*
    Assort Params
*/
global.sha256_Obj = function (paramObj, skip_keys) {
    var chk = "";
    for (var t in paramObj) {
        if (skip_keys && has(skip_keys, t)) {
            continue;
        }
        if (paramObj[t] && has(paramObj, t)) {
            chk += t + paramObj[t].toString();
        }
    }
    return sha256(chk);
};

﻿var rsa: any = require("node-rsa");
var forsake: any = require("forsake");
import crypto = require('crypto');
import fs = require("fs");
import path = require("path");

//this one will disappear when we swapped into trustzone implementation babe
var temp_keystore = {};


/**
 * 
 *  Sig check process..
 * 
 *  (Load Pubkey in Memory)      <--->     Memory Fock Head, Replace In-Mem Pubkey Attack
 *             |
 *             v
 *        (Verify Sig)           <--->     Stack Jumpo Death, Function-Redirection Attack
 *             |
 *             v
 *          (RESULT)             <-------- NON-TRUSTWORTHY RESULT
 * 
 * 
 * 
 * 
 * 
 *  (Public Key Stored in IC)    <-------- Software never sees this (safe, hopefully)
 *             x 
 *                  x---------------------------------------------Function Replacement ? (STILL DANGEROUS, LOOKING FOR A GOOD SANDBOX THEN)
 *    (Hardware Call to IC) -- Generate SEM Call Key (as addr) -  ADDR CHANGES EVERYTIME
 *                                                       |_______ Replace IC to Custom one? 
 *      (Encoded Result)    -- [KEY MATCH?]              |        Small impact
 *                                  |                    -
 *                                  |                    |------- Key Alg needs to be investigated
 *                                  v
 *                                Result                 |------- Trust worthy ?
 * 
 */

function Unsafe_SyncRSAEncrypt_Fast(keyname, content): Buffer {
    var pem = undefined;
    if (temp_keystore[keyname] && (pem = temp_keystore[keyname].exportKey('public'))) {

        return forsake.encrypt(content, pem).toString("hex");

    } else {

        throw new Error("RSA key not found");

    }
}

function Safe_SyncRSAEncrypt_Fast(keyname, content, cb: PCallback<Buffer>) {
    process.nextTick(() => {
        try {
            var result = Unsafe_SyncRSAEncrypt_Fast(keyname, content);
            return cb(undefined, result);
        }
        catch (e) {
            return cb(e);
        }
    });
}

//WE WILL USE TRUSTZONE, SOMEDAY LATER
//TODO: ENABLE TRUSTZONE & DUAL-OS SETUP

function LoadPubkey(keyname, PEM) {
    try {
        var key = new rsa(PEM);
        if (!key.isPublic()) {
            throw new Error("Not a valid public key");
        }
        else {
            temp_keystore[keyname] = key;
        }
    } catch (e) {
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
    } else {
        var data = fs.readFileSync(f, 'utf8').toString();
        LoadPubkey(keyname, data);
        info("* GOT PEM " + keyname["greenBG"].bold);
        info("* KEY LENGTH = " + temp_keystore[keyname].getKeySize());
    }
}

/**
 * Sig should be in hex encoding
 * Data however, should be in utf8 encoding
 */
function _RSA_Verify(keyname, sig, data) {

    trace("Validating sig using " + keyname.bold);
    if (!temp_keystore.hasOwnProperty(keyname)) {
        return false;
    }
    else {
        var rsa = temp_keystore[keyname];
        if (!rsa.isPublic()) {
            return false;
        } else {
            return rsa.verify(data, sig, "utf8", "hex");
        }
    }

}


//These are all temporary..
export function Initialize() {
    global.RSA_Verify = _RSA_Verify;


    global.Unsafe_SyncRSAEncrypt_Fast = Unsafe_SyncRSAEncrypt_Fast;
    global.Safe_SyncRSAEncrypt_Fast = Safe_SyncRSAEncrypt_Fast;

    trace("Temporary Public Key Store is UP");
    LoadFromFile("App");
    LoadFromFile("Router");
}

var _ = console.log;
var rl = require("readline-sync");
var os = require("os");
var rsa = require("node-rsa");
var path = require("path");
var fs = require("fs");
var crypto = require('crypto');
var pubkey = undefined;
var prvkey = undefined;
var curkey = undefined;
if (os.platform() == "win32") {
    process.stdout.write('\033c');
} else {
    console.log('\033[2J');
}



function GenSalt(len) {
    return crypto.randomBytes(len);
}

/*Implement this as a lib (future)*/
function _hash_subdir(dir) {
    var res = "";
    if (!fs.existsSync(dir)) {
        return "";
    } else if (fs.statSync(dir).isDirectory()) {
        var d = fs.readdirSync(dir).sort();
        //d = d.sort();
        for (var i = 0; i < d.length; i++) {
            var target = path.join(dir, d[i]);
            console.log(d[i]);
            res += d[i] + "~" + _hash_subdir(target);
        }
    } else {
        var hash = crypto.createHash('sha512');
        hash.update(fs.readFileSync(dir));
        return hash.digest("hex");
    }
    var hash = crypto.createHash('sha512');
    hash.update(res);
    return hash.digest("hex");
}

function HashDirectory(dir, salt) {
    var res = _hash_subdir(dir);
    console.log(" PBKDF2 .. KeyLength = " + res.length);
    return crypto.pbkdf2Sync(res, salt, 1000, 256);
}








_("******* Edge RouterOS Application Signing Tool *******");

while (true) {
    try {
        _("");
        _("LOAD :    Load Keys");
        _("SIGN :    Sign Target Directory");
        _("VERF :    Verify Target Directory");
        _("GEN  :    Regenerate PK Pair (USE WITH CAUTION)");
        if (curkey) {
            _("  Current Key [ " + curkey + " ]");
            _("                 |");
            _("                 +---{PUBLIC KEYSIZE} = " + pubkey.getKeySize());
            _("                 |");
            _("                 +---{PRIVATE KEYSIZE} = " + prvkey.getKeySize());
        }
        var d = rl.question("CMD ->    ");
        
        switch (d) {
            case "VERF":
                if (!curkey) {
                    _(" ** PLEASE LOAD KEY FIRST ** ");
                    continue;
                }
                var t = rl.question("SIG FILE(.txt) > ");
                if (!t || t == "")
                    continue;
                t = fs.readFileSync(t + ".txt").toString("utf8");
                _("Extracting Salt");
                var salt = new Buffer(t.substring(0, 512), "hex");
                _("Extracting Signature");
                var sig = t.substring(512, t.length);
                var t = rl.question("DIR NAME > ");
                if (!t || t == "")
                    continue;
                var hash = HashDirectory(t, salt);
                var snapshot = salt.toString("hex") + hash.toString("hex");
                var result = pubkey.verify(snapshot, sig, "utf8", "hex");
                _("Authentic? : " + (result ? "Yes" : "No"));
                break;
            case "SIGN":
                if (!curkey) {
                    _(" ** PLEASE LOAD KEY FIRST ** ");
                    continue;
                }
                var t = rl.question("DIR NAME > ");
                if (!t || t == "")
                    continue;
                _("Creating Salt");
                var salt = GenSalt(256);
                _("Hashing Directory...");
                var hash = HashDirectory(t, salt);
                _("\HASH: \n\n");
                _(hash.toString("hex"));
                _("\nSNAPSHOT: \n\n");
                //SALT[512], HASH..
                var snapshot = salt.toString("hex") + hash.toString("hex");
                _(snapshot);
                var sign = prvkey.sign(snapshot, "hex", "utf8");
                _("\SIGNATURE: \n\n");
                _(sign);
                var t = rl.question("SAVE TO > ");
                if (!t || t == "")
                    continue;
                _("\CONCAT_ED: \n\n");
                var data = salt.toString("hex") + sign.toString();
                console.log(data);
                fs.writeFileSync(t + ".txt", data);
                _("Done.");
                break;
            case "LOAD":
                var t = rl.question("KEY NAME > ");
                if (!t || t == "")
                    continue;
                _("Loading.. Please wait...");
                var pk = fs.readFileSync(t + "/key.pb").toString();
                var pr = fs.readFileSync(t + "/key.pr").toString();
                pubkey = new rsa(pk);
                prvkey = new rsa(pr);
                console.log("Testing..");
                var sign = prvkey.sign("test", "hex");
                var result = pubkey.verify("test", sign, "utf8", "hex");
                console.log("Test Result: " + result);
                curkey = t;
                break;
            case "GEN":
                var B = rl.question("KEYLENGTH (DEFAULT = 2048) > ");
                var E = rl.question("EXPONENT (DEFAULT = 65537) > ");
                if (!B || B == "") {
                    B = 2048;
                }
                if (!E || E == "") {
                    E = 65537;
                }
                _("Working.. \nGo grab some coffee and check back later..");
                var r = new rsa({ b: B, e: E });
                console.log(r.exportKey());
                console.log(r.exportKey('public'));
                var t = rl.question("KEY NAME > ");
                if (!t || t == "")
                    continue;
                if (fs.existsSync(t)) {
                    _("Dir Exists [" + t + "]");
                    if (rl.question("Over-write its content? (Y/N)") !== "Y") { continue; }
                } else {
                    _("Creating Directory [" + t + "]");
                    fs.mkdirSync(t);
                }
                _("Writing Public PEM into [" + t + "]");
                fs.writeFileSync(t + "/" + "key.pb", r.exportKey('public'));
                _("Writing Private PEM into [" + t + "]");
                fs.writeFileSync(t + "/" + "key.pr", r.exportKey());
                _("Done.");
                break;
        }
    } catch (e) {
        _("ERROR!");
        _(e);
    }
    
    _("");
    _("");
    _("");
    _("");
}

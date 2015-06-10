import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import child_process = require('child_process');

var algorithm = '-aes-256-cbc';
var passwdLength = 64;

export function RandomPassword(bytesLength = passwdLength) {
    return crypto.randomBytes(bytesLength).toString('hex');
}

export function EncryptFileProcess(filePath:string, password:string):child_process.ChildProcess {
    console.log('encrypting file:', filePath, 'with password', password);
    return child_process.spawn('openssl', ['enc', algorithm, '-in', filePath, '-pass', 'pass:' + password]);
}


/**
 * need node-rsa 0.2.22
 * password: hex encoding
 */
export function EncryptAESPassword(router_uid:string, password:string, pubkey:string, callback:Callback) {
    if (!fs.existsSync(ORBIT_CONF.PKG_TMP_PATH)) {
        fs.mkdirSync(ORBIT_CONF.PKG_TMP_PATH);
    }
    var routerTmpPath = path.join(ORBIT_CONF.PKG_TMP_PATH, router_uid);
    if (!fs.existsSync(routerTmpPath)) {
        fs.mkdirSync(routerTmpPath);
    }
    var pubkeyPath = path.join(routerTmpPath, UUIDstr());
    var passwordPath = path.join(routerTmpPath, UUIDstr());
    var passwordEncryptedPath = path.join(routerTmpPath, UUIDstr());

    fs.writeFileSync(pubkeyPath, pubkey);
    fs.writeFileSync(passwordPath, password);

    var cp = child_process.spawn('openssl', ['rsautl', '-encrypt', '-pubin', '-inkey', pubkeyPath, '-in', passwordPath, '-out', passwordEncryptedPath]);
    var err = '';
    cp.stderr.on('data', (data) => {
        err += data.toString();
    });
    cp.on('close', ()=> {
        if(err.trim() !== ''){
            return callback(err);
        }
        var encrypted = fs.readFileSync(passwordEncryptedPath, {encoding: 'binary'});
        callback(null, encrypted);
    });
}

//export function DecryptFileStream(encryptedFilePath:string, password:string):stream.Readable {
//    return child_process.spawn('openssl', ['enc', '-d', '-k', password, '-in', encryptedFilePath]).stdout;
//}

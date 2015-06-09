import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import child_process = require('child_process');

var algorithm = '-aes-256-cbc';
var passwdLength = 256;

export function RandomPassword(bytesLength = passwdLength) {
    return crypto.randomBytes(bytesLength).toString('hex');
}

export function EncryptFileProcess(filePath:string, password:string): child_process.ChildProcess {
    console.log('encrypting file:', filePath, 'with password', password);
    return child_process.spawn('openssl', ['enc', algorithm, '-in', filePath, '-pass', 'pass:' + password]);
}

//export function DecryptFileStream(encryptedFilePath:string, password:string):stream.Readable {
//    return child_process.spawn('openssl', ['enc', '-d', '-k', password, '-in', encryptedFilePath]).stdout;
//}

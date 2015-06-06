import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import stream =  require('stream');
import child_process = require('child_process');

var algorithm = 'aes-256-cbc';
var passwdLength = 256;

export function RandomPassword(bytesLength=passwdLength) {
    return crypto.randomBytes(bytesLength);
}

export function EncryptFileSteram(filePath:string, password:string): stream.Readable {
    return child_process.spawn('openssl', ['enc', '-k', password, '-in', filePath]).stdout;
}

export function DecryptFileStream(encryptedFilePath:string, password:string):stream.Readable {
    return child_process.spawn('openssl', ['enc', '-d', '-k', password, '-in', encryptedFilePath]).stdout;
}

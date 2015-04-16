import fs = require('fs');
import path = require('path');

// blob size: 212 bytes
var blobPath = path.join(process.env.NODE_PATH
    , '../Applications/Launcher/manifest.json');
var blob = <any>undefined;

export function ReadConfig(cb){
    if(blob) return cb(null, blob);

    fs.readFile(blobPath, (err, data) => {
        blob = data;
        cb(null, data);
    });
}
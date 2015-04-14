import fs = require('fs');
import path = require('path');

// blob size: 6M
var blobPath = path.join(process.env.NODE_PATH
    , '../Applications/Launcher/Main_Staging/public/images/bg/mountain.jpg');

export function Howl() {
    fs.readFile(blobPath, (err, blob) => {
        __EMIT('Huge.Come', blob);
        __EMIT('Huge.Go', blob);
    });

    var args = [].slice.call(arguments);
    var cb:Function = args.pop();
    cb(null, 'HugeParamsEmitter.Howl()');

}
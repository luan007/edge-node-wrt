import fs = require('fs');
import path = require('path');

// blob size: 312K
var blobPath = path.join(process.env.NODE_PATH
    , '../Applications/Launcher/Main_Staging/public/images/bg/aji.jpg');

export function Howl(cb) {
    cb(null, 'HugeParamsEmitter.Howl()');
}

global.__module__.on('loaded', ()=>{
    setInterval(() => {
        //fs.readFile(blobPath, (err, blob) => {
        __EMIT('Huge.Come', {
            'name': 'Come',
            't': new Date()
        });
        __EMIT('Huge.Go', {
            'name': 'Come',
            't': new Date()
        }); // don't send blob simultaneously
        //});

    }, 1);
});

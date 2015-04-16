import fs = require('fs');
import path = require('path');

// blob size: 6.2M
var blobPath = path.join(process.env.NODE_PATH
    , '../Applications/Launcher/Main_Staging/public/images/bg/mountain.jpg');

//var ref = new Array(5000 * 1000);
//var i = 0;
var blob = <any>undefined;

export function Howl(cb) {

    //console.log(i++);
    if(blob) return cb(null, blob);

    fs.readFile(blobPath, (err, data) => {
        blob = data;
        cb(null, data);
            //'HugeParamsEmitter.Howl()' );
    });
}

//global.__module__.on('loaded', ()=>{
//    setInterval(() => {
//        //fs.readFile(blobPath, (err, blob) => {
//        __EMIT('Huge.Come', {
//            'name': 'Come',
//            't': new Date()
//        });
//        __EMIT('Huge.Go', {
//            'name': 'Come',
//            't': new Date()
//        }); // don't send blob simultaneously
//        //});
//
//    }, 10000);
//});

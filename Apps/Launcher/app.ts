/// <reference path="./global.d.ts" />
process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

import http = require("http");
import fs = require("fs");
import path = require("path");

if (!global.EDGE) {
    global.async = require("async");
    console.log("Debug Env");
    async.series([
        (cb) => { require("./Auth/server").Initialize(9999, cb); },
        (cb) => { require("./Main_Staging/server").Initialize(8080, cb); }
    ],(err) => {
             console.log("Launcher is up @ " +
                    9999 + " ~ " + 8888);
    });
}
else {
    console.log("Within Edge..");
    fs.stat("/");
    //Clean Up
    if (fs.existsSync("/Data/sock")) {
        var stat: fs.Stats;
        var old = fs.readdirSync("/Data/sock");
        for (var i = 0; i < old.length; i++) {
            try {
                fs.unlinkSync("/Data/sock/" + old[i]);
            } catch (e) {
                console.log(e);
            }
        }
        if ((stat = fs.statSync("/Data/sock")).isDirectory()) { }
        else {
            fs.unlinkSync("/Data/sock");
            fs.mkdirSync("/Data/sock");
        }
    }
    else {
        fs.mkdirSync("/Data/sock");
    }
    var MainPort = "sock/" + UUIDstr();
    var AuthPort = "sock/" + UUIDstr();
    async.series([
        (cb) => { require("./Auth/server").Initialize("/Data/" + AuthPort, cb); },
        (cb) => { require("./Staging/server").Initialize("/Data/" + MainPort, cb); }
    ],(err) => {
            console.log("Settingup Launcher's port");
            API.Launcher.SetupPort(MainPort, AuthPort,(err, result) => {
                if (err) console.log(err);
                console.log("Launcher is up @ " +
                    MainPort + " ~ " + AuthPort);
            });
        });

}


// setTimeout(()=> {
//     console.log('_____________>> [1]');
//     API.RegisterEvent('Device.change', (err, res) => {
//         if (err) {
//             return console.log('_____________>> register remote event error: ', err);
//         }
//         else {
//             API.Driver.Match('print', (err, drivers)=> {
//                 console.log('_____________>> [4]', err, drivers);
//                 if (err) return console.log(err);
//                 if (!drivers) return console.log('_____________>> [4] no driver matched.');
//                 if (Object.keys(drivers).length === 0) return console.log('_____________>> [4] no driver matched.');
// 
//                 //var pair = drivers[0];
// 
//                 //API.IO.CreateFD((err, fd)=> {
//                 //    console.log('_____________>> [5] API.IO.CreateFD', err, fd);
//                 //
//                 //    var params = <any>{
//                 //        fd: fd,
//                 //        job_name: 'Job-' + fd
//                 //    };
//                 //    params.user = {name: 'Admin'};
//                 //
//                 //    var filePath = '/three.docx';
//                 //    var r = fs.createReadStream(filePath);
//                 //    var w = fs.createWriteStream("/Share/IO/" + fd);
//                 //    r.pipe(w);
//                 //
//                 //    API.Driver.Invoke(pair.driverId, pair.deviceId, 'print', params, (err)=> {
//                 //        if (err) return console.log('received invoke callback err', err);
//                 //        else return console.log('print job was queued.');
//                 //    });
//                 //});
//             });
//         }
//     });
// }, 10 * 1000);

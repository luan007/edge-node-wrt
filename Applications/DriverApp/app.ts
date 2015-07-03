process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

var OUI = require('./OUI/OUI');

OUI.Initialize(()=> {
});


//var MACDevices = {};

//API.RegisterEvent('P0F.device', (err, res) => {
//    if(err) {
//        return console.log('register remote event error: ', err);
//    }
//    else {
//        console.log('register remote event successful.', res);
//        API.P0F.on('device', (device) => {
//            MACDevices[device.hwaddr] = device;
//            console.log('InAppDriver P0FService --->>>', device);
//        });
//    }
//});

var fs = require('fs');
console.log('_____________>> [1]');
API.RegisterEvent('Device.change', (err, res) => {
    if (err) {
        return console.log('_____________>> register remote event error: ', err);
    }
    else {
        API.Driver.Match('print', (err, drivers)=> {
            console.log('_____________>> [4]', err, drivers);
            if (err) return console.log(err);
            if (!drivers) return console.log('_____________>> [4] no driver matched.');
            if (Object.keys(drivers).length === 0) return console.log('_____________>> [4] no driver matched.');

            var pair = drivers[0];

            //API.IO.CreateFD((err, fd)=> {
            //    console.log('_____________>> [5] API.IO.CreateFD', err, fd);
            //
            //    var params = <any>{
            //        fd: fd,
            //        mime_type: 'application/pdf',
            //        job_name: 'Job-' + fd
            //    };
            //    params.user = {name: 'Admin'};
            //
            //    var filePath = '/edge.pdf';
            //    var r = fs.createReadStream(filePath);
            //    var w = fs.createWriteStream("/Share/IO/" + fd);
            //    r.pipe(w);
            //
            //    API.Driver.Invoke(pair.driverId, pair.deviceId, 'print', params, (err)=> {
            //        if (err) return console.log('received invoke callback err', err);
            //        else return console.log('print job was queued.');
            //    });
            //});
        });
    }
});

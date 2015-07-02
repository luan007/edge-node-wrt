process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

var OUI = require('./OUI/OUI');

OUI.Initialize(()=> {
    //var net = require('net');
    //setInterval(()=>{
    //    var client = net.connect({host:'172.0.0.1',port: 8888},
    //        function() { //'connect' listener
    //            console.log('connected to server!');
    //        });
    //    client.on('data', function(data) {
    //        console.log(data.toString());
    //        client.end();
    //    });
    //    client.on('error', function(err) {
    //        console.log(err.toString());
    //    });
    //    client.on('end', function() {
    //        console.log('disconnected from server');
    //    });
    //}, 1000);
});


var MACDevices = {};

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
    if(err) {
        return console.log('_____________>> register remote event error: ', err);
    }
    else {
        API.Device.on('change', (dev_id, dev, data)=> {
            console.log('_____________>> [2]', dev_id);

            API.Driver.Match(dev, 'print', function (err, drivers){
                console.log('_____________>> [4]', err, drivers);
                if (err) return console.log(err);
                if (!drivers) return console.log('no driver matched.');
                if(Object.keys(drivers).length === 0) return console.log('no driver matched.');

                var drv = drivers[0];
                console.log('driver matched', drv.id());
                var filePath = '/linux-manual.pdf';
                var readStream = fs.createReadStream(filePath);

                API.IO.CreateFD((err, fd)=> {
                    var params = <any>{
                        fd: fd,
                        mime_type: 'application/pdf',
                        job_name: 'Job-1'
                    };
                    params.user = {name: 'Admin'};

                    API.IO.OnFDConnect(fd, ()=> {
                        readStream.pipe(fd);
                    });

                    API.Driver.Invoke(drv, dev, 'print', params, (err)=> {
                        if (err) console.log('received invoke callback err', err);
                        return console.log('print success.');
                    });
                });
            });
        });

        //console.log('_____________>> register remote event', res, API, API.Device);
    }
});

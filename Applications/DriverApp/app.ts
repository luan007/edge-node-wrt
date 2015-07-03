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
    if (err) {
        return console.log('_____________>> register remote event error: ', err);
    }
    else {
        //API.Device.on('change', (dev_id, dev, data)=> {
        //    console.log('_____________>> [2]', dev_id);
        //    var assumptions = dev.assumptions;
        var assumptions = JSON.parse('{"App_DriverApp:IPP":{"classes":{"printer":""},"actions":{"print":""},"aux":{},"attributes":{"name":"NPIFEF707","printer.uri-supported.ipp":"ipp://192.168.66.11:631/ipp/print","printer.uri-supported.ipps":"ipps://192.168.66.11:443/ipp/print","vendor":"HP","printer.info":"HP LaserJet 200 colorMFP M276nw","printer.status.state":"idle","printer.icons.normal":"http://192.168.66.11/ipp/images/printer.png","printer.icons.large":"http://192.168.66.11/ipp/images/printer-large.png","printer.resolution":"600 600 dpi","printer.uuid":"urn:uuid:434e4438-4635-4e43-4a4b-d4c9effef707","printer.airprint":true,"printer.airprint.version":"1.3","printer.color.supported":true,"printer.doc.image.urf":true,"printer.doc.pdf":true,"printer.doc.postscript":true,"printer.doc.vnd.hp-PCL":true,"printer.doc.PCLm":true,"printer.doc.octet-stream":true},"valid":true,"driverId":"App_DriverApp:IPP"}}');

        //API.Driver.Dummy((err, res)=>{
        //   console.log('___________>> [X]', err, res);
        //});

        API.Driver.Match('print', (err, drivers)=> {
            console.log('_____________>> [4]', err, drivers);
            if (err) return console.log(err);
            if (!drivers) return console.log('_____________>> [4] no driver matched.');
            if (Object.keys(drivers).length === 0) return console.log('_____________>> [4] no driver matched.');

            var pair = drivers[0];

            API.IO.CreateFD((err, fd)=> {
                console.log('_____________>> [5] API.IO.CreateFD', err, fd);

                var params = <any>{
                    fd: fd,
                    mime_type: 'application/pdf',
                    job_name: 'Job-' + fd
                };
                params.user = {name: 'Admin'};

                var filePath = '/linux-manual.pdf';
                var r = fs.createReadStream(filePath);
                var w = fs.createWriteStream("/Share/IO/" + fd);
                r.pipe(w);

                API.Driver.Invoke(pair.driverId, pair.deviceId, 'print', params, (err)=> {
                    if (err) return console.log('received invoke callback err', err);
                    else return console.log('print job was queued.');
                });
            });
        });
        //});

    }
});

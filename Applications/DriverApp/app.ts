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


//var MACDevices = {};
//
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



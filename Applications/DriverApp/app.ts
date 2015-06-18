process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

var OUI = require('./OUI/OUI');

OUI.Initialize(()=> {
    //setInterval(console.log, 1000);
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



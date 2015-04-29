require('../System/Env');

process.on('uncaughtException', function (err) {
    error(err);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    error(err);
});

domain.run(function () {
    var modules = [
        './Router/Network/Index',
        './Router/Network/Firewall/Index',
        './Router/Network/Wireless/Wifi',
        './Router/Network/Wireless/Bluetooth'
    ];

   modules.forEach((m) => {
      require(m);
   });
});
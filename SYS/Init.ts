require('./Env');

process.on('uncaughtException', function (err) {
    error(err);
    error(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    error(err);
    error(err.stack);
});

domain.run(function () {
    var modules = [
        './Router/Network/Index'
        , './Router/Network/Firewall/Firewall'
        , './Router/Network/Wireless/Wifi'
        , './Router/Network/Wireless/Bluetooth'
    ];
    var initializes = [];
    var subscribes = [];
    for (var i = 0, len = modules.length; i < len; i++) {
        ((_i) => {
            var m = require(modules[_i]);
            if (m.Subscribe) {
                subscribes.push((cb) => {
                    m.Subscribe(cb);
                });
            }
            if (m.Initialize) {
                initializes.push((cb) => {
                    m.Initialize(cb);
                });
            }
        })(i);
    }

    info('subscribes', subscribes, 'initializes', initializes);

    async.series(subscribes.concat(initializes), (err) => {
        if (err) error(err);
        require('./Router/Network/Firewall/Test');
    });

});
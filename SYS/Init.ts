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
        , './Router/Network/Firewall/Index'
        , './Router/Network/Wireless/Wifi'
        , './Router/Network/Wireless/Bluetooth'
    ];
    var tasks = [];
    for (var i = 0, len = modules.length; i < len; i++) {
        ((_i) => {
            tasks.push((cb) => {
                require(modules[_i]).Initialize(cb);
            });
        })(i);
    }

    info('tasks', tasks);

    async.series( tasks, (err) => {
        if(err) error(err);
        require('./Router/Network/Firewall/Test');
    });

});
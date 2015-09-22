process.env.ROOT_PATH = __dirname;

var async = require("async");

process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    console.log(err);
    console.log(err.stack);
});

domain.run(function () {
    var modules = [
        { path: './Router/Network/network', name: 'Network' }
    ];
    var initializes = [];
    var subscribes = [];
    for (var i = 0, len = modules.length; i < len; i++) {
        (function (_i) {
            var m = require(modules[_i].path);
            var name = modules[_i]['name'];
            if (m.Subscribe) {
                subscribes.push(function (cb) {
                    m.Subscribe(cb);
                });
            }
            if (m.Initialize) {
                initializes.push(function (cb) {
                    var start = new Date();
                    m.Initialize(function () {
                        if (name) {
                            var now = new Date();
                            var totalSeconds = (now - start) / 1000;
                            console.log('[' + name + '] total seconds:', totalSeconds);
                        }
                        cb();
                    });
                });
            }
        })(i);
    }

    async.series(subscribes.concat(initializes), function(err) {
        console.log('========>>> entire series executed, then daemon.');
    });
});
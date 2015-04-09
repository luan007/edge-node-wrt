require('./Env');

import APIServer = require('./APIServer');

info(" * Init");

var target_node_modules = __dirname;
process.env.NODE_PATH = target_node_modules;
info('process.env.NODE_PATH:', target_node_modules);

require('colors');

var domain = require('domain').create();
domain.on('error', function (err) {
    error(err);
});
domain.run(function () {
    APIServer.Initialize();
});

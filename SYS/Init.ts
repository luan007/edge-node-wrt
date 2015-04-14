require('./Env');
require('colors');

import _APIServer = require('./APIServer');
import APIServer = _APIServer.APIServer;
import Consumer = require('./Consumer');

//for injection
var cfgFileName = 'api.config.json';
process.env.apiConfigFilePath = path.join(__dirname, '../' + cfgFileName);

info(" * Init");

var target_node_modules = __dirname;
process.env.NODE_PATH = target_node_modules;
info('process.env.NODE_PATH:', target_node_modules);

var domain = require('domain').create();
domain.on('error', function (err) {
    error(err);
});
domain.run(function () {
    var server = new APIServer();
    server.on('loaded', () => {
        info('modules all loaded.');
        Consumer.Initalize(server.getSockPath());
    });
});

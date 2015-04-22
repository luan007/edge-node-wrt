require('../Env');
require('colors');
require('../../System/API/PermissionDef');

import _APIServer = require('./APIServer');
import APIServer = _APIServer.APIServer;
import Consumer = require('./Consumer');
import pm = require('../../System/API/Permission');

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
    server.on('ready', () => {
        info('modules all loaded.');
        pm.SetPermission(process.pid, pm.Encode([Permission.System]));
        Consumer.Initalize(server.getFuncSockPath());
    });
});

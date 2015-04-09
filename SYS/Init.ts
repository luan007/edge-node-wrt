global.path = require("path");
global.http = require("http");
global.qs = require("querystring");
global.async = require("async");
require("colors");
require('../System/Base/Global');
require('../System/SubSys/Native/commands');
require('../Modules/Shared/Basic/flowcontrol');
require('../Modules/Shared/Crypto/UUID');
require('../System/Lib/Log/Prelaunch');

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

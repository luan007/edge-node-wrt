var APIServer = require('./APIServer');
console.log(" * Init");
var target_node_modules = __dirname + ":" + process.argv[2];
process.env.NODE_PATH = target_node_modules;
console.log(target_node_modules);
require('colors');
var domain = require('domain').create();
domain.on('error', function (err) {
    console.log(err);
});
domain.run(function () {
    APIServer.Initialize();
});

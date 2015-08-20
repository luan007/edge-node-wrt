require('../SYS/Env');

process.on('uncaughtException', function (err) {
    fatal(err);
    fatal(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    fatal(err);
    fatal(err.stack);
});
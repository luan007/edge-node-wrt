var fs = require('fs'),
    assert = require("assert"),
    path = require('path'),
    Util = require('./Util');

function writeLog(level, msg) {
    if(!CONF.LOG_TO_FILE) // should switch on
        return;

    var now = new Date();
    var prefix = path.join(dir, now.getFullYear() + '' + Util.TwoDigitalize(now.getMonth() + 1));
    var time = now.getFullYear() + '-' + (now.getMonth() + 1)  + '-' + Util.TwoDigitalize(now.getDate())
        + ' ' + Util.TwoDigitalize(now.getHours()) + ':' + Util.TwoDigitalize(now.getMinutes()) + ':' + Util.TwoDigitalize(now.getSeconds());
    var data = '[' + level + '] - ' + time + ' : ' + msg + '\n';
    exec('mkdir', '-p', prefix, function(){
        var file = path.join(prefix, Util.NumericDate(now) + '.log');
        fs.appendFile(file, data);
    });
}

var level = {
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    tarce: 'TRACE',
    fatal :'FATAL'
};
var dir = path.join(__dirname, "logs");

var logger = <any>({});
logger.debug = function(msg){
    return writeLog(level.debug, msg);
}
logger.info = function(msg){
    return writeLog(level.info, msg);
}
logger.warn = function(msg){
    return writeLog(level.warn, msg);
}
logger.error = function(msg){
    return writeLog(level.error, msg);
}
logger.tarce = function(msg){
    return writeLog(level.tarce, msg);
}
logger.fatal = function(msg){
    return writeLog(level.fatal, msg);
}

module.exports = logger;
var fs = require('fs'),
    path = require('path'),
    Stack = require('./Stack'),
    child_process = require('child_process');

function TwoDigitalize(number) {
    return (number < 10 ? '0' + number.toString() : number.toString());
}

function NumericDate(date) {
    var str = date.getFullYear() + TwoDigitalize(date.getMonth() + 1) + TwoDigitalize(date.getDate());
    return Number(str);
}

function writeLog(level, ...args) {
    if(!CONF.LOG_TO_FILE || !args) // should switch on
        return;

    var stack = Stack.getModule(2);
    var now = new Date();
    var prefix = path.join(dir, now.getFullYear() + '' + TwoDigitalize(now.getMonth() + 1));
    var time = now.getFullYear() + '-' + TwoDigitalize(now.getMonth() + 1) + '-' + TwoDigitalize(now.getDate())
        + ' ' + TwoDigitalize(now.getHours()) + ':' + TwoDigitalize(now.getMinutes()) + ':' + TwoDigitalize(now.getSeconds());
    var data = '[' + level + '] - ' + time + ' : [' + stack+ '] ' + args.join('\t') + '\n';
    child_process.exec('mkdir -p ' + prefix, function (err) {
        if(err) return console.log(err);
        var file = path.join(prefix, NumericDate(now) + '.log');
        fs.appendFile(file, data);
    });
}

var level = {
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    tarce: 'TRACE',
    fatal :'FATAL',
    uncaught: 'UNCAUGHT',
    domainerr: 'DOMAINERR'
};
var dir = path.join(__dirname, "logs");

export function debug(...args){
    return writeLog(level.debug, args);
}
export function info(...args){
    return writeLog(level.info, args);
}
export function warn(...args){
    return writeLog(level.warn, args);
}
export function error(...args){
    return writeLog(level.error, args);
}
export function tarce(...args){
    return writeLog(level.tarce, args);
}
export function fatal(...args){
    return writeLog(level.fatal, args);
}
export function uncaught(...args){
    return writeLog(level.uncaught, args);
}
export function domainerr(...args){
    return writeLog(level.domainerr, args);
}


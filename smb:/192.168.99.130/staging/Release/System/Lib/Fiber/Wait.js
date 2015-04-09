function Initialize() {
}
exports.Initialize = Initialize;
function ReqFiber(req, res, next) {
    wait.launchFiber(next);
}
function await(func) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var param = [func];
    var p = param.concat(args);
    wait.for.apply(this, p);
}
function NonBlockSleep(time, callback) {
    setTimeout(function () {
        callback(null, true);
    }, time);
}
function sleep(time) {
    wait.for(NonBlockSleep, time);
}
exports.sleep = sleep;

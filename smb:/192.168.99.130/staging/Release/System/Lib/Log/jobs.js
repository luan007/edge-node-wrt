var Stack = require("./Stack");
var log4js = require('log4js');
(function () {
    if (!CONF.IS_DEBUG || !CONF.ENABLE_FULL_LOG) {
        return;
    }
    if (CONF.TIMER_LOG) {
        var oldS = setInterval;
        var oldCs = clearInterval;
        global["setInterval"] = function (f, t) {
            var funcName = Stack.getFunctionName(f);
            var logger = log4js.getLogger(Stack.getModule(1));
            var s = oldS(function () {
                logger.warn.apply(logger, [
                    " Tick * " + ("[" + funcName + "]").bold + " @ " + t.toString().bold + " (ms)"
                ]);
                f();
            }, t);
            logger.warn.apply(logger, [
                "+Timer " + ("[" + funcName + "]").bold + " @ " + t.toString().bold
            ]);
            return s;
        };
        global["clearInterval"] = function (t) {
            var result = oldCs(t);
            info("-Timer");
            return result;
        };
        warn("System Timer Log_Override has been Enabled".bold);
    }
    if (CONF.TIMEOUT_LOG) {
        var oldT = setTimeout;
        var oldCt = clearTimeout;
        global["setTimeout"] = function (f, t) {
            var funcName = Stack.getFunctionName(f);
            var logger = log4js.getLogger(Stack.getModule(1));
            var s = oldT(function () {
                logger.warn.apply(logger, [
                    " Trig * " + ("[" + funcName + "]").bold + " @ " + t.toString().bold + " (ms)"
                ]);
                f();
            }, t);
            logger.warn.apply(logger, [
                "+Timeout" + " " + ("[" + funcName + "]").bold + " @ " + t.toString().bold
            ]);
            return s;
        };
        global["clearTimeout"] = function (t) {
            var result = oldCt(t);
            info("-Timeout");
            return result;
        };
        warn("System Timeout Log_Override has been Enabled".bold);
    }
})();

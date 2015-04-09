var Stack = require("./Stack");
(function () {
    if (!CONF.IS_DEBUG || !CONF.ENABLE_FULL_LOG) {
        global.trace = global.warn = global.error = global.fatal = global.debug = global.info = function () {
            return false;
        };
        return;
    }
    var log4js = require('log4js');
    log4js.configure({
        appenders: [
            {
                type: 'console',
                layout: {
                    type: 'pattern',
                    pattern: "%[%d{ABSOLUTE} %c%] %m"
                }
            }
        ]
    });
    global.trace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var logger = log4js.getLogger(Stack.getModule());
        logger.trace.apply(logger, args);
    };
    global.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var logger = log4js.getLogger(Stack.getModule());
        logger.warn.apply(logger, args);
    };
    global.fatal = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var logger = log4js.getLogger(Stack.getModule());
        logger.fatal.apply(logger, args);
    };
    global.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var logger = log4js.getLogger(Stack.getModule());
        logger.debug.apply(logger, args);
    };
    global.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var logger = log4js.getLogger(Stack.getModule());
        logger.error.apply(logger, args);
    };
    global.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var logger = log4js.getLogger(Stack.getModule());
        logger.info.apply(logger, args);
    };
})();

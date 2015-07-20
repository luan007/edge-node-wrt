/****************/
/*   WARNING    */
//THIS LIB COMES WITH A HUUUUUUUUUUUGE COST!!!!
//
//IT'S A MUST TO DISABLE THIS DURING LAUNCH TIME

import Stack = require("./Stack");
import FileLogger = require('./FileLogger');
(() => {

    if (!CONF.IS_DEBUG || !CONF.ENABLE_FULL_LOG) {
        global.trace = global.warn = global.error = global.fatal = global.debug = global.info = function () {
            return false;
        };
        return;
    }

    var log4js:any = require('log4js');
    //log4js.loadAppender('file');
    //log4js.addAppender(log4js.appenders.console());
    //log4js.addAppender(log4js.appenders.file('logs/cheese.log'), 'cheese');
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

    global.trace = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.trace.apply(logger, args);
    };

    global.warn = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.warn.apply(logger, args);
    };

    global.fatal = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.fatal.apply(logger, args);

        FileLogger.fatal(args);
    };

    global.debug = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.debug.apply(logger, args);
    };

    global.error = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.error.apply(logger, args);

        FileLogger.error(args);
    };

    global.info = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.info.apply(logger, args);
    };

    if (CONF.LOG_LEVELS && CONF.LOG_LEVELS.length > 0) {
        var loggers = ['trace', 'warn', 'error', 'fatal', 'debug', 'info'];
        for (var i = 0, len = loggers.length; i < len; i++) {
            if (CONF.LOG_LEVELS.indexOf(loggers[i]) === -1) {
                global[loggers[i]] = function () {
                    return false;
                }
            }
        }
    }

})();

//logger.trace('Entering cheese testing');
//logger.debug('Got cheese.');
//logger.info('Cheese is Gouda.');
//logger.warn('Cheese is quite smelly.');
//logger.error('Cheese is too ripe!');
//logger.fatal('Cheese was breeding ground for listeria.');
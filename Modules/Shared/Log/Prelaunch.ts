/****************/
/*   WARNING    */
//THIS LIB COMES WITH A HUUUUUUUUUUUGE COST!!!!
//
//IT'S A MUST TO DISABLE THIS DURING LAUNCH TIME

import Stack = require("./Stack");
import FileLogger = require('./FileLogger');
import hook = require('./leHook');
(() => {

    if (!CONF.IS_DEBUG || !CONF.ENABLE_FULL_LOG) {
        global.trace = global.warn = global.error = global.fatal = global.debug = global.info = function () {
            return false;
        };
        return;
    }
    
    hook.Passthrough('stderr', process.stderr);

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
        hook.DoLog('trace', args.toString());
        
    };

    global.warn = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.warn.apply(logger, args);
        hook.DoLog('warn', args.toString());
        
    };

    global.fatal = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.fatal.apply(logger, args);
        hook.DoLog('fatal', args.toString());

        FileLogger.fatal(args);
    };

    global.debug = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        hook.DoLog('debug', args.toString());
        logger.debug.apply(logger, args);
    };

    global.error = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.error.apply(logger, args);

        hook.DoLog('error', args.toString());
        FileLogger.error(args);
    };

    global.info = (...args) => {
        var logger = log4js.getLogger(Stack.getModule());
        logger.info.apply(logger, args);
        hook.DoLog('info', args.toString());
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
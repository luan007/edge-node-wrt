var ns:any = {};

function __isOn(moduleName){
    var nodes = moduleName.split(":");
    var cur = ns;
    for(var i = 0, len = nodes.length; i< len; i++) {
        var n = nodes[i];
        if(!cur[n]) return false;
        cur = cur[n];
        if(cur.hasOwnProperty("sw") && cur.sw === false) return false;
    }
    return true;
}

export function GetLogger(moduleName, sw?:boolean){
    if(sw === undefined) sw = true;
    Turn(moduleName, sw);

    var logger = {};

    logger.trace = (...args) => {
        if(__isOn(moduleName)) {
            var logger = log4js.getLogger(moduleName);
            logger.trace.apply(logger, args);
            hook.DoLog('trace', args.toString());
        }
    };

    logger.warn = (...args) => {
        if(__isOn(moduleName)) {
            var logger = log4js.getLogger(moduleName);
            logger.warn.apply(logger, args);
            hook.DoLog('warn', args.toString());
        }
    };

    logger.fatal = (...args) => {
        if(__isOn(moduleName)) {
            var logger = log4js.getLogger(moduleName);
            logger.fatal.apply(logger, args);
            hook.DoLog('fatal', args.toString());

            FileLogger.fatal(args);
        }
    };

    logger.debug = (...args) => {
        if(__isOn(moduleName)) {
            var logger = log4js.getLogger(moduleName);
            hook.DoLog('debug', args.toString());
            logger.debug.apply(logger, args);
        }
    };

    logger.error = (...args) => {
        if(__isOn(moduleName)) {
            var logger = log4js.getLogger(moduleName);
            logger.error.apply(logger, args);

            hook.DoLog('error', args.toString());
            FileLogger.error(args);
        }
    };

    logger.info = (...args) => {
        if(__isOn(moduleName)) {
            var logger = log4js.getLogger(moduleName);
            logger.info.apply(logger, args);
            hook.DoLog('info', args.toString());
        }
    };

    return logger;
}

export function Turn(moduleName, sw?:boolean){
    var nodes = moduleName.split(":");
    var cur = ns;
    for(var i = 0, len = nodes.length; i< len; i++) {
        var n = nodes[i];
        if(!cur[n]) cur[n] = {};
        cur = cur[n];
        if(i === len - 1) cur.sw = !!sw;
    }
}
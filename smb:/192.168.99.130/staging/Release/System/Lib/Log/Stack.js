function getFunctionName(fn) {
    return (fn + '').split(/\s|\(/)[1];
}
exports.getFunctionName = getFunctionName;
function getCallerFile(layer) {
    try {
        if (layer === undefined) {
            layer = 1;
        }
        var err = new Error();
        var callerfile;
        var currentfile;
        Error.prepareStackTrace = function (err, stack) {
            return stack;
        };
        var stack = err.stack;
        Error.prepareStackTrace = undefined;
        currentfile = stack.shift().getFileName();
        var l = 0;
        while (stack.length) {
            callerfile = stack.shift().getFileName();
            if (currentfile !== callerfile) {
                if (l === layer) {
                    return callerfile;
                }
                else {
                    l++;
                }
            }
        }
    }
    catch (err) {
    }
    return undefined;
}
exports.getCallerFile = getCallerFile;
function getModule(layer) {
    var mod = getCallerFile(layer).replace(CONF.BASE_PATH, "").replace(/(\\|\/)+/g, ':');
    return mod.substring(0, mod.length - 3);
}
exports.getModule = getModule;

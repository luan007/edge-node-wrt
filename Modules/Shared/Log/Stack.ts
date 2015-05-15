export function getFunctionName (fn) {
    return (fn + '').split(/\s|\(/)[1];
}
// private
export function getCallerFile(layer?) {
    try {
        if (layer === undefined) {
            layer = 1;
        }
        var err: any = new Error();
        var callerfile;
        var currentfile;
        (<any>Error).prepareStackTrace = function (err, stack) { return stack; };

        var stack = err.stack;
        (<any>Error).prepareStackTrace = undefined;
        currentfile = stack.shift().getFileName();

        var l = 0;
        while (stack.length) {
            callerfile = stack.shift().getFileName();
            if (currentfile !== callerfile) {
                if (l === layer) {
                    return callerfile;
                } else {
                    l++;
                }
            }
        }

    } catch (err) { }
    return undefined;
}

export function getModule(layer?) {
    var mod = getCallerFile(layer).replace(CONF.BASE_PATH, "").replace(/(\\|\/)+/g, ':');
    return mod.substring(0, mod.length - 3);
}

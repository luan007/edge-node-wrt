var fs = require('fs');
var path = require('path');
var cfgFileName = 'api.config.json';
var filePath = path.join(__dirname, cfgFileName);
var APIConfig;
var modulesConfig;
var eventsConfig;
function getModulesConfig() {
    if (!modulesConfig) {
        console.log('filePath', filePath);
        if (fs.existsSync(filePath)) {
            var contents = fs.readFileSync(filePath, { encoding: 'utf-8' });
            modulesConfig = JSON.parse(contents);
            var moduleIndex = 1, funcIndex;
            for (var moduleName in modulesConfig) {
                var functions = modulesConfig[moduleName]['Functions'];
                funcIndex = 1;
                for (var funcName in functions) {
                    functions[funcName].funcid = 1000 * moduleIndex + funcIndex;
                    funcIndex++;
                }
                moduleIndex++;
            }
        }
    }
    return modulesConfig;
}
exports.getModulesConfig = getModulesConfig;
function getAPIConfig() {
    if (!APIConfig) {
        var result = {};
        var config = getModulesConfig();
        for (var moduleName in config) {
            var moduleConf = config[moduleName], functions = moduleConf['Functions'];
            for (var funcName in functions) {
                var func = functions[funcName];
                result[func.funcid] = {
                    moduleName: moduleName,
                    funcName: funcName,
                    permission: func['Permission']
                };
            }
        }
        APIConfig = result;
    }
    return APIConfig;
}
exports.getAPIConfig = getAPIConfig;
function getEventsConfig() {
    if (!eventsConfig) {
        var result = {};
        var config = getModulesConfig();
        for (var moduleName in config) {
            var moduleConf = config[moduleName], events = moduleConf['Events'];
            for (var eventName in events) {
                var evt = events[eventName];
                result[eventName] = {
                    moduleName: moduleName,
                    permission: evt['Permission']
                };
            }
        }
        eventsConfig = result;
    }
    return eventsConfig;
}
exports.getEventsConfig = getEventsConfig;
function fileChanged(curr, prev) {
    if (curr.mtime !== prev.mtime) {
        console.log('api.config has been changed. curr mtime is: ', curr.mtime, 'prev mtime was: ' + prev.mtime);
        if (fs.existsSync(filePath)) {
            modulesConfig = null;
            APIConfig = null;
            getAPIConfig();
            console.log(getAPIConfig);
        }
    }
}
fs.watchFile(filePath, fileChanged);

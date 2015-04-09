import fs = require('fs');
import path = require('path');

var cfgFileName = 'api.config.json';
var filePath = path.join(process.cwd(), cfgFileName);
var APIConfig;
var modulesConfig;

export function getModulesConfig() {
    if (!modulesConfig) {
        if (fs.existsSync(filePath)) {
            var contents = fs.readFileSync(filePath, {encoding: 'utf-8'});
            modulesConfig = JSON.parse(contents);
            var moduleIndex = 1, funcIndex;
            for (var moduleName in modulesConfig) {
                var functions = modulesConfig[moduleName]['Functions'];
                funcIndex = 1;
                for (var funcName in functions) { // funcid = 1000 * moduleIndex + funcIndex;
                    functions[funcName].funcid = 1000 * moduleIndex + funcIndex;
                    funcIndex++;
                }
                moduleIndex++;
            }
        }
    }
    return modulesConfig;
}

/**
 * @returns { funcId: { moduleName, funcName, permission } [, ...] }
 *  funcid = 1000 * moduleIndex + funcIndex;
 */
export function getAPIConfig() {
    if (!APIConfig) {
        var result = {};
        var config = getModulesConfig();
        for (var moduleName in config) {
            var moduleConf = config[moduleName],
                functions = moduleConf['Functions'];
            for (var funcName in functions) {
                var func = functions[funcName];
                result[func.funcid] = {
                    moduleName: moduleName
                    , funcName: funcName
                    , permission: func['Permission']
                };
            }
        }
        APIConfig = result;
    }
    return APIConfig;
}

// watcher for api.config
function fileChanged(curr, prev) {
    if (curr.mtime !== prev.mtime) {
        console.log('api.config has been changed. curr mtime is: ',
            curr.mtime, 'prev mtime was: ' + prev.mtime);
        if (fs.existsSync(filePath)) {
            modulesConfig = null;
            APIConfig = null;
            getAPIConfig();  // reload config & update global
            console.log(getAPIConfig);
        }
    }
}
fs.watchFile(filePath, fileChanged);
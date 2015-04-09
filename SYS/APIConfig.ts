import fs = require('fs');
import path = require('path');

var cfgFileName = 'api.config.json';
var filePath = path.join(process.cwd(), cfgFileName);
global.APIConfig = null;
global.modulesConfig = null;

export function modulesConfig() {
    if (!global.modulesConfig) {
        if (fs.existsSync(filePath)) {
            var contents = fs.readFileSync(filePath, {encoding: 'utf-8'});
            global.modulesConfig = JSON.parse(contents);
            var moduleIndex = 1, funcIndex;
            for (var moduleName in global.modulesConfig) {
                var functions = global.modulesConfig[moduleName]['Functions'];
                funcIndex = 1;
                for (var funcName in functions) { // funcid = 1000 * moduleIndex + funcIndex;
                    functions[funcName].funcid = 1000 * moduleIndex + funcIndex;
                    funcIndex++;
                }
                moduleIndex++;
            }
        }
    }
    return global.modulesConfig;
}

/**
 * @returns { funcId: { moduleName, funcName, permission } [, ...] }
 *  funcid = 1000 * moduleIndex + funcIndex;
 */
export function APIConfig() {
    if (!global.APIConfig) {
        var result = {};
        var config = modulesConfig();
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
        global.APIConfig = result;
    }
    return global.APIConfig;
}

// watcher for api.config
function fileChanged(curr, prev) {
    if (curr.mtime !== prev.mtime) {
        console.log('api.config has been changed. curr mtime is: ',
            curr.mtime, 'prev mtime was: ' + prev.mtime);
        if (fs.existsSync(filePath)) {
            global.modulesConfig = null;
            global.APIConfig = null;
            APIConfig();  // reload config & update global
            console.log(global.APIConfig);
        }
    }
}
fs.watchFile(filePath, fileChanged);
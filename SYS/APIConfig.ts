import fs = require('fs');
import path = require('path');

var cfgFileName = 'api.config.json';
var filePath = path.join(__dirname, '../' + cfgFileName);
var APIConfig:{} = undefined;
var modulesConfig:{} = undefined;
var eventsConfig:{} = undefined;


export function getModulesConfig() {
    if (!modulesConfig) {
        console.log('api.config.json path:', filePath);
        if (fs.existsSync(filePath)) {
            var contents = fs.readFileSync(filePath, {encoding: 'utf-8'});
            modulesConfig = JSON.parse(contents);
            var moduleIndex = 1, funcIndex, eventIndex;
            for (var moduleName in modulesConfig) {
                var functions = modulesConfig[moduleName]['Functions']
                    , events = modulesConfig[moduleName]['Events'];
                funcIndex = 1;
                for (var funcName in functions) { // funcid = 1000 * moduleIndex + funcIndex;
                    functions[funcName].funcid = 1000 * moduleIndex + funcIndex;
                    funcIndex++;
                }
                eventIndex = 1;
                for (var eventName in events) { // eventId = 1000 * moduleIndex + eventIndex;
                    events[eventName].eventId = 1000 * moduleIndex + eventIndex;
                    eventIndex++;
                }
                moduleIndex++;
            }
        }
    }
    return modulesConfig;
}

/**
 * @returns
 * { funcId: { moduleName, funcName, permission } [, ...] }
 */
export function getAPIConfig():{} {
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
                    , permission: func['Permission'].map((p)=> {
                        return Permission[p];
                    })
                };
            }
        }
        APIConfig = result;
    }
    return APIConfig;
}

/**
 * @returns
 * { eventId: { moduleName, eventName, permission } [, ...] }
 */
export function getEventsConfig() {
    if (!eventsConfig) {
        var result = {};
        var config = getModulesConfig();
        for (var moduleName in config) {
            var moduleConf = config[moduleName],
                events = moduleConf['Events'];
            for (var eventName in events) {
                var evt = events[eventName];
                result[evt.eventId] = {
                    moduleName: moduleName
                    , eventName: eventName
                    , permission: evt['Permission'].map((p)=> {
                        return Permission[p];
                    })
                };
            }
        }
        eventsConfig = result;
    }
    return eventsConfig;
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
        }
    }
}
fs.watchFile(filePath, fileChanged);
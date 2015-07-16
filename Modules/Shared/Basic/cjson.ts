var cjson = require("circular-json");

global.CJSONString = function(obj): string {
    return cjson.stringify(obj);
}

global.CJSONParse = function(str) {
    return cjson.parse(str);
}

global.jclone = function(obj){
    return JSON.parse(JSON.stringify(obj));
};
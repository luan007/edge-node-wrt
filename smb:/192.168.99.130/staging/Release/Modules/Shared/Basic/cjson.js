var cjson = require("circular-json");
global.CJSONString = function (obj) {
    return cjson.stringify(obj);
};
global.CJSONParse = function (str) {
    return cjson.parse(str);
};

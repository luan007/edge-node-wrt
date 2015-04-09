global.has = function (obj, key) {
    if (obj === undefined || obj === null)
        return false;
    return obj.hasOwnProperty(key);
};
function Type(obj) {
    if (obj === undefined)
        return "undefined";
    if (obj === null)
        return "null";
    var text = Function.prototype.toString.call(obj.constructor);
    return text.match(/function (.*)\(/)[1];
}
function deep_delta(o, delta, override, pretend) {
    if (override === void 0) { override = true; }
    if (pretend === void 0) { pretend = false; }
    var change_level = {};
    for (var i in delta) {
        if (!has(delta, i))
            continue;
        if (Type(delta[i]) == "Function")
            continue;
        if (!has(o, i)) {
            if (!pretend)
                o[i] = delta[i];
            change_level[i] = delta[i];
        }
        else if (!override || Type(o[i]) == "Function") {
            continue;
        }
        else if ((Type(o[i]) !== Type(delta[i]) || !_.isObject(o[i]) || !_.isObject(delta[i])) && !_.isEqual(o[i], delta[i])) {
            if (!pretend) {
                o[i] = delta[i];
            }
            change_level[i] = delta[i];
        }
        else if (!_.isEqual(o[i], delta[i])) {
            change_level[i] = deep_delta(o[i], delta[i], override);
        }
    }
    return change_level;
}
global.deep_delta = deep_delta;
global.delta_add = function (o, plus, override) {
    if (override === void 0) { override = true; }
    deep_delta(o, plus, override);
    return o;
};
global.delta_add_return_changes = function (o, plus, override, pretend) {
    if (override === void 0) { override = true; }
    if (pretend === void 0) { pretend = false; }
    return deep_delta(o, plus, override, pretend);
};
global.delta_mod = function (o, mod) {
    deep_delta(o, mod, false);
    return o;
};

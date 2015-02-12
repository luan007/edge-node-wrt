global.has = function (obj, key)
{
    if (obj === undefined || obj === null) return false;
    return obj.hasOwnProperty(key);
}

function Type(obj) {
    if (obj === undefined) return "undefined";
    if (obj === null) return "null";
    var text = Function.prototype.toString.call(obj.constructor);
    return text.match(/function (.*)\(/)[1];
}

function deep_delta(o, delta, override = true) {
    var change_level = {};
    for (var i in delta) {
        if (!has(delta, i)) continue;
        //if (delta[i] === global.UNCHANGED) continue;
        //if (delta[i] === global.DELETED) {
        //    if (has(o, i)) {
        //        delete o[i];
        //        change_level[i] = undefined;
        //    }
        //    continue;
        //}
        if (Type(delta[i]) == "Function") continue;
        if (!has(o, i)) {
            o[i] = delta[i];
            change_level[i] = delta[i];
        } else if (!override || Type(o[i]) == "Function") {
            continue;
        } else if (
            (
            Type(o[i]) !== Type(delta[i]) ||
            !_.isObject(o[i]) ||
            !_.isObject(delta[i])
            ) &&
            !_.isEqual(o[i], delta[i])) {
            o[i] = delta[i];
            change_level[i] = delta[i];
        } else if (!_.isEqual(o[i], delta[i])) { //both are objects / or undefined / or array
            //same type, Object/Array type
            change_level[i] = deep_delta(o[i], delta[i], override);
        }
    }
    return change_level;
}

global.deep_delta = deep_delta;

global.delta_add = function (o, plus, override = true) {
    //for (var i in plus) {
    //    if ((override || !o.has(i))) {
    //        o[i] = plus[i];
    //    }
    //}
    //return o;

    deep_delta(o, plus, override);
    return o;
}



global.delta_add_return_changes = function (o, plus, override = true) {
    //var change = {};
    //for (var i in plus) {
    //    if (((override && !_.isEqual(plus[i], o[i])) || !o.has(i))) {
    //        o[i] = plus[i];
    //        change[i] = plus[i];
    //    }
    //}
    //return change;

    return deep_delta(o, plus, override);
}

global.delta_mod = function (o, mod) {
    deep_delta(o, mod, false);
    return o;
}


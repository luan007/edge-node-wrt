function _forEachFlat(arr, flag, parent, index, layer, job) {
    if (flag.stop)
        return;
    if (!Array.isArray(arr)) {
        if (flag.stop)
            return;
        return job(arr, flag, index, parent, layer);
    }
    else {
        var t = Object.keys(arr);
        for (var i = 0; i < t.length; i++) {
            if (flag.stop)
                return;
            _forEachFlat(arr[t[i]], flag, arr, i, layer + 1, job);
        }
    }
}
global.forEachFlat = function (arr, job) {
    _forEachFlat(arr, { stop: false }, undefined, undefined, -1, job);
};
var _change_cache = {};
function _didChange(name, thisTime, comp_func) {
    var last = _change_cache[name];
    var same = false;
    if (comp_func) {
        same = comp_func(thisTime, last);
    }
    else {
        same = thisTime === last;
    }
    if (!same) {
        _change_cache[name] = thisTime;
        return true;
    }
    else {
        return false;
    }
}
global.didChange = _didChange;

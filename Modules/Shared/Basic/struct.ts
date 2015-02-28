

function _forEachFlat(arr, parent, index, layer, job) {
    if (!Array.isArray(arr)) {
        return job(arr, index, parent, layer);
    } else {
        var t = Object.keys(arr);
        for (var i = 0; i < t.length; i++) {
            _forEachFlat(arr[t[i]], arr, i, layer + 1, job);
        }
    }
}

//turns [[1],[[[[[2], [3], [[1], [2, 3, 4]]]]]] into 1, 2, 3, 1, 2, 3, 4.. good for segmentation
global.forEachFlat = function(arr, job) {
    //i love recursion
    _forEachFlat(arr, undefined, undefined, -1, job);
}

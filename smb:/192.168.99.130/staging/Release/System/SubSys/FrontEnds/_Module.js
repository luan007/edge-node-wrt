exports.Load = function (load_arg, callback) {
    require("./HttpProxy").Initialize(function (err, result) {
        if (err) {
            error(err);
            throw (err);
        }
        callback();
    });
};

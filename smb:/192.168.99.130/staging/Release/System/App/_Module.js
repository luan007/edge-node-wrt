exports.Load = function (load_arg, callback) {
    require("./RuntimePool").Initialize();
    callback();
};

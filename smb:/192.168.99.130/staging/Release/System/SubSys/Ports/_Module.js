exports.Load = function (load_arg, callback) {
    require("./Redirector");
    require("./Tracker").Initialize(callback);
};

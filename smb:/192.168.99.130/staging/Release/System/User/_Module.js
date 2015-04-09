exports.Load = function (load_arg, callback) {
    async.series([
        require("./UserManager").Initialize.bind(null)
    ], callback);
};

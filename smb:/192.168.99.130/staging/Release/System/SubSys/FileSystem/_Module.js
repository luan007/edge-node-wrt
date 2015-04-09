exports.Load = function (load_arg, callback) {
    async.series([
        require("./IsolatedZone").Initialize,
        require("./UserZone").Initialize
    ], callback);
};

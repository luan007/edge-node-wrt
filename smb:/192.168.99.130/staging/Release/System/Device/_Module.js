exports.Load = function (load_arg, callback) {
    async.series([
        require("./Graphd/DB").Initialize,
        require("./DeviceManager").Initialize,
        require("./DriverManager").Initialize
    ], callback);
};

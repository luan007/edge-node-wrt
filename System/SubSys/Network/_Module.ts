exports.Load = function (load_arg: string[], callback) {
    async.series([
        require("./TrafficAccountant").Initialize
    ], callback);
}

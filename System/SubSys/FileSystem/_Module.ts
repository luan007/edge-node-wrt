exports.Load = function (load_arg: string[], callback) {
    async.series([
        require("./IsolatedZone").Initialize,
        require("./UserZone").Initialize], callback);
}

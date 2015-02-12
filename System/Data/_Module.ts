exports.Load = function (load_arg: string[], callback) {
    async.series([
        require("./Storage").Initialize.bind(null, CONF.MAIN_SQL_PATH),
        require("./Registry").Initialize.bind(null, CONF.MAIN_REGISTRY_PATH)
    ], callback);
}
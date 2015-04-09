var fs = require("fs");
exports.Load = function (load_arg, callback) {
    async.series([
        (function (cb) {
            try {
                if (!fs.existsSync(CONF.DATA_DIR)) {
                    fs.mkdirSync(CONF.DATA_DIR);
                }
                return cb();
            }
            catch (e) {
                return cb(e);
            }
        }).bind(null),
        require("./Storage").Initialize.bind(null, CONF.MAIN_SQL_PATH),
        require("./Registry").Initialize.bind(null, CONF.MAIN_REGISTRY_PATH)
    ], callback);
};

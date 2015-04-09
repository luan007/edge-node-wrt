(function () {
    if (!CONF.IS_DEBUG || !CONF.ENABLE_FULL_LOG) {
        return;
    }
    var net = require("net");
    var old_listen = net.Server.prototype.listen;
    net.Server.prototype.listen = function () {
        info("Listening on " + arguments[0]);
        old_listen.apply(this, arguments);
    };
    warn("net.Server Log_Override has been Enabled".bold);
})();

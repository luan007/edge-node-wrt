exports.Load = function (load_arg, callback) {
    require("./commands");
    async.series([
        require("./iproute2").Initialize,
        require("./iptables").Initialize,
        require("./iw").Initialize,
        require("./user").ClearGenerated,
    ], callback);
};
SYS_ON(0 /* LOADED */, function () {
    require("./mdns").Initialize(function () {
    });
    require("./ssdp").Initialize(function () {
    });
});

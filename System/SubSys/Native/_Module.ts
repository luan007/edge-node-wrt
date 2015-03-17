exports.Load = function (load_arg: string[], callback: Function) {
    require("./commands");
    async.series([
        require("./iproute2").Initialize,
        require("./iptables").Initialize,
        require("./iw").Initialize,
        require("./user").ClearGenerated,
        require("./mdns").Initialize,
        require("./ssdp").Initialize,
    ], <any>callback);
}

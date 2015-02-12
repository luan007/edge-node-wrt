
exports.Load = function (load_arg: string[], callback: Function) {
    require("./Remote/Client");
    require("./Network/ARP").Initialize();
    //require("./Network/UserAgent").Initialize();
    require("./OUI/OUI").Initialize();
    //require("./Fiber/Wait").Initialize();
    require("./Crypto/RSA").Initialize();
    require("./Crypto/HashDir");
    callback();
}
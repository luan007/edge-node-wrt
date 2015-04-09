var _mac_conf = (function () {
    function _mac_conf() {
        this.ROUTERID = "TEST_ROUTER_0";
        this.ModelName = "Edge Dev";
        this.ModelNumber = " _D_E_V_ ";
        this.Serial = "______";
        this.Major = "0";
        this.Minor = "0";
        this.ModelUrl = "http://edge.network";
        this.DefaultUrl = "http://wifi.network";
    }
    return _mac_conf;
})();
var MACHINE = new _mac_conf();
global.MACHINE = MACHINE;

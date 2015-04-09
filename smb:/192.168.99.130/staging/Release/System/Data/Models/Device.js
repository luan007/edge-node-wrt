var store = require("../Storage");
exports.Table = undefined;
var Device = (function () {
    function Device() {
        this.uid = "";
        this.assumptions = {};
        this.hwaddr = "";
        this.busname = "";
        this.busdata = {};
        this.state = 0;
        this.time = new Date();
        this.config = {};
        this.ownership = "";
    }
    Device.table = function () {
        if (!exports.Table) {
            exports.Table = store.DefineTable("Device", Device, { id: ["uid"] });
        }
        return exports.Table;
    };
    return Device;
})();
exports.Device = Device;

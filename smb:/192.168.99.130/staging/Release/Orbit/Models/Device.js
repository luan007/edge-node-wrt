var store = require("../Storage");
exports.Table = undefined;
var Device = (function () {
    function Device() {
        this.uid = "";
        this.hwaddr = "";
        this.busname = "";
        this.router_uid = "";
        this.local_dev_uid = "";
        this.accessTime = new Date();
        this.updateTime = new Date();
        this.attributes = {};
    }
    Device.table = function () {
        if (!exports.Table) {
            var db = store.Database;
            exports.Table = store.DefineTable("Device", Device, { id: ["uid"] });
            exports.Table["hasOne"]('router', store.Models.Router.Router.table(), {
                required: true,
                autoFetch: true
            });
        }
        return exports.Table;
    };
    return Device;
})();
exports.Device = Device;

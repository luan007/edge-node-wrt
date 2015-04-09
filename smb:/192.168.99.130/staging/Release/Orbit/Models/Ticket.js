var store = require("../Storage");
var user = require("./User");
var router = require("./Router");
var device = require("./Device");
exports.Table = undefined;
var Ticket = (function () {
    function Ticket() {
        this.uid = "";
        this.refreshToken = "";
        this.refreshSalt = "";
        this.expire = 0;
        this.device_uid = "";
        this.owner_uid = "";
        this.router_uid = "";
        this.attributes = {};
        this.accessTime = new Date();
    }
    Ticket.table = function () {
        if (!exports.Table) {
            var db = store.Database;
            exports.Table = store.DefineTable("Ticket", Ticket, { id: ["uid"] });
            Ticket.table()["hasOne"]('owner', user.User.table(), {
                required: true,
                autoFetch: true
            });
            Ticket.table()["hasOne"]('router', router.Router.table(), {
                required: true,
                autoFetch: true
            });
            Ticket.table()["hasOne"]('device', device.Device.table(), {
                required: true,
                autoFetch: true
            });
        }
        return exports.Table;
    };
    return Ticket;
})();
exports.Ticket = Ticket;

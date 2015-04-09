var store = require("../Storage");
exports.Table = undefined;
var Router = (function () {
    function Router() {
        this.uid = "";
        this.salt = "";
        this.hashedkey = "";
        this.access = "";
        this.accessTime = new Date();
        this.state = 0;
        this.attributes = {};
        this.checksumkey = "";
    }
    Router.table = function () {
        if (!exports.Table) {
            var db = store.Database;
            exports.Table = store.DefineTable("Router", Router, { id: ["uid"] });
        }
        return exports.Table;
    };
    return Router;
})();
exports.Router = Router;

var store = require("../Storage");
exports.Table = undefined;
var User = (function () {
    function User() {
        this.uid = "";
        this.name = "";
        this.data = {};
        this.lastSeen = new Date();
    }
    User.table = function () {
        if (!exports.Table) {
            exports.Table = store.DefineTable("User", User, { id: ["uid"] });
        }
        return exports.Table;
    };
    return User;
})();
exports.User = User;

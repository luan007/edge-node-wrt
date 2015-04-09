var store = require("../Storage");
exports.Table = undefined;
var User = (function () {
    function User() {
        this.uid = "";
        this.name = "";
        this.email = "";
        this.salt = "";
        this.data = {};
        this.hashedkey = "";
    }
    User.table = function () {
        if (!exports.Table) {
            var db = store.Database;
            exports.Table = store.DefineTable("User", User, { id: ["uid"] });
        }
        return exports.Table;
    };
    return User;
})();
exports.User = User;

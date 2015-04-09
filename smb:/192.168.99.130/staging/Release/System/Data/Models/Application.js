var store = require("../Storage");
exports.Table = undefined;
var Application = (function () {
    function Application() {
        this.uid = "";
        this.appsig = "";
        this.name = "";
        this.urlName = "";
    }
    Application.table = function () {
        if (!exports.Table) {
            exports.Table = store.DefineTable("Application", Application, { id: ["uid"] });
        }
        return exports.Table;
    };
    Application.Strip = function (App) {
        return {
            uid: App.uid
        };
    };
    return Application;
})();
exports.Application = Application;

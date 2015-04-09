var Core = require("Core");
SYS_ON(0 /* LOADED */, function () {
    warn("Test - Data Generator Starting..");
    warn(" YOU WILL LOSE DATA!!");
    warn("Now.. Clearing Application Table");
    Core.Data.Tables.Application().get(CONF.CORE_PARTS["LAUNCHER"], function (err, result) {
        if (!err && result)
            return;
        trace("First run?");
        Core.Data.Tables.Application().create([{
            uid: "TestApp",
            name: "TestApp",
            urlName: "TestApp",
            appsig: "a"
        }, {
            uid: CONF.CORE_PARTS["LAUNCHER"],
            urlName: "",
            name: "Launcher",
            appsig: "a"
        }], function (err, instance) {
            warn("App Data Generated ... ");
        });
    });
    Orbit.Post("User", { name: "mikeluan", email: "1@emerge.cc", password: "1234567890" }, function (err, result) {
    });
});

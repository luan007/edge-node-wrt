import Core = require("Core");
import Node = require("Node");

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
    warn("Test - Data Generator Starting..");
    warn(" YOU WILL LOSE DATA!!");
    warn("Now.. Clearing Application Table");
    Core.Data.Tables.Application().clear().sync((err) => {
        if (err) throw err;

        Core.Data.Tables.Application().create({
            uid: "TestApp",
            name: "TestApp",
            urlName: "TestApp",
            appsig: "a"
        }, (err, instance) => {
                warn("App Data Generated ... ");
                Core.App.RuntimePool.LoadApplication("TestApp", (err, str) => { });
        });

        Core.Data.Tables.Application().create({
            uid: CONF.CORE_PARTS["LAUNCHER"],
            urlName: "",
            name: "Launcher",
            appsig: "a"
        }, (err, instance) => {
                warn("App Data Generated ... ");
                Core.App.RuntimePool.LoadApplication(CONF.CORE_PARTS["LAUNCHER"], (err, str) => { });
        });

        //Core.Data.Tables.Application().create({
        //    uid: "2",
        //    appsig: "a"
        //}, (err, instance) => {
        //        warn("App Data Generated ... ");
        //        Core.App.RuntimePool.LoadApplication("2", (err, str) => {
        //            if (!err) {
        //                Core.App.RuntimePool.GetAppByRID(str).Start();
        //            }
        //        });
        //});

        //Core.Data.Tables.Application().create({
        //    uid: "3",
        //    appsig: "a"
        //}, (err, instance) => {
        //        warn("App Data Generated ... ");
        //        Core.App.RuntimePool.LoadApplication("3", (err, str) => {
        //            if (!err) {
        //                Core.App.RuntimePool.GetAppByRID(str).Start();
        //            }
        //        });
        //});

        //Core.Data.Tables.Application().create({
        //    uid: "4",
        //    appsig: "a"
        //}, (err, instance) => {
        //        warn("App Data Generated ... ");
        //        Core.App.RuntimePool.LoadApplication("4", (err, str) => {
        //            if (!err) {
        //                Core.App.RuntimePool.GetAppByRID(str).Start();
        //            }
        //        });
        //    });


        Orbit.Post("User", { name: "mikeluan", email: "1@emerge.cc", password: "1234567890" },(err, result) => {

        });
    });
});
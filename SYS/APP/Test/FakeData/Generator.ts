import _Application = require('../../../DB/Models/Application');
import Application = _Application.Application;
require('../../Remote/Client');

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
    warn("Test - Data Generator Starting..");
    warn(" YOU WILL LOSE DATA!!");
    warn("Now.. Clearing Application Table");

    Application.table().get(CONF.CORE_PARTS["LAUNCHER"],(err, result) => {
        if (!err && result) return;
        trace("First run?");
        Application.table().create([{
            uid: "TestApp",
            name: "TestApp",
            urlName: "TestApp",
            appsig: "a"
        }, {
                uid: CONF.CORE_PARTS["LAUNCHER"],
                urlName: "",
                name: "Launcher",
                appsig: "a"
            }
        ],(err, instance) => {
                warn("App Data Generated ... ");
                //         Core.App.RuntimePool.LoadApplication("TestApp", (err, str) => { });

            });

    });

    Orbit.Post("User", { name: "mikeluan", email: "1@emerge.cc", password: "1234567890" },(err, result) => {

    });
});
require("./Env");
import Loader = require("./loader");

Loader.Load(["Base", "Lib", "Data", "API", "SubSys", "Device", "User", "App", "Router", "Test"], (err, result) => {
    process.nextTick(() => {
        if (err) {
            SYS_TRIGGER(SYS_EVENT_TYPE.ERROR, err);
            console.log(err);
            console.log(err.stack);
        } else {
            SYS_TRIGGER(SYS_EVENT_TYPE.LOADED, err);
        }
    });
});

process.on("uncaughtException",(err) => {
    console.log("Error:" + err.name);
    console.log(err.message);
    console.log("------------------");
    console.log(err.stack);
    console.log("------------------");
});
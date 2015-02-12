import Core = require("Core");
import Node = require("Node");

Core.Device.Graphd.RebuildDeltaV((err) => {

    if (err) {
        error(err);
    }
    else {
        info("Good");
    }

    Core.Device.Graphd.Search_By_Name("dummyAttribute", (err, result) => {
        Core.Device.Graphd.Get(result[0].owner, (err, result) => {
            console.log(JSON.stringify(result));
        });
    });

    //Core.Device.DB.id("", (err, result) => {
    //    console.log(err);
    //});
    //hotswap("deltaV", (done) => {
    //    console.log("Hotswapping..");
    //    setTimeout(done, 10000);
    //});
    //Core.Device.DB.find({}, (err, result) => {
    //    console.log(err);
    //});
});
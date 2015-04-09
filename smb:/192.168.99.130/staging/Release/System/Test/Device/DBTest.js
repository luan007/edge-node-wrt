var Core = require("Core");
Core.Device.Graphd.RebuildDeltaV(function (err) {
    if (err) {
        error(err);
    }
    else {
        info("Good");
    }
    Core.Device.Graphd.Search_By_Name("dummyAttribute", function (err, result) {
        Core.Device.Graphd.Get(result[0].owner, function (err, result) {
            console.log(JSON.stringify(result));
        });
    });
});

exports.Load = function (load_arg: string[], callback: Function) {
    //require("./IsolatedZone").Initialize((err, result) => {
    //    if (err) {
    //        error(err);
    //        throw (err);
    //    }
    //    callback();
    //});
    async.series([
        require("./LocalNetwork").Initialize,
        require("./Wifi").Initialize
    ], <any>callback);
}
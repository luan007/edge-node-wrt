exports.Load = function (load_arg: string[], callback: Function) {

    async.series([
        require("./Graphd/DB").Initialize,
        require("./DeviceManager").Initialize,
        require("./DriverManager").Initialize
    ], <any>callback);

}
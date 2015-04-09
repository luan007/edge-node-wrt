exports.Load = function (load_arg: string[], callback: Function) {
    async.series([
        require("./UserManager").Initialize.bind(null)
    ], <any>callback);
}
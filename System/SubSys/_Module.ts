exports.Load = function (load_arg: string[], callback) {
    async.series([
        require("./Native/_Module").Load.bind(undefined, load_arg),
        require("./FileSystem/_Module").Load.bind(undefined, load_arg),
        require("./Ports/_Module").Load.bind(undefined, load_arg),
        require("./FrontEnds/_Module").Load.bind(undefined, load_arg),
    ], callback);
}

exports.Load = function(load_arg: string[], callback: Function) {
    require("./RuntimePool").Initialize();
    callback();
}

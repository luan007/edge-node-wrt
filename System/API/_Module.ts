exports.Load = function (load_arg: string[], callback: Function) {
    require("./FunctionExposer");
    require("./EventHub");
    require("./Server").Initialize();
    callback();
}

exports.Load = function (load_arg: string[], callback: Function) {
    require("./Redirector");
    require("./Tracker").Initialize(callback);
}

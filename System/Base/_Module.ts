export function Load(load_arg: string[], callback) {
    require("./SystemEvent");
    require("./Global");
    require("./Machine");

    //init interfaces
    callback();
}

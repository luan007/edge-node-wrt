export function Load(load_arg: string[], callback: Function) {
    require("./SystemEvent");
    require("./Global");
    require("./Machine");
    callback();
}

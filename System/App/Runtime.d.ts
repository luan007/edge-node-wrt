import Core = require("Core");
declare class Runtime {
    private _process;
    constructor(runtimeId: any, app: Core.Data.Application);
    Start: () => void;
    Status: () => void;
    Stop: () => void;
}
export = Runtime;

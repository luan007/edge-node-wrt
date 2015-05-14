import _Application = require('../DB/Models/Application');
import Application = _Application.Application;
declare class Runtime {
    private _process;
    constructor(runtimeId: any, app: Application);
    Start: () => void;
    Status: () => void;
    Stop: () => void;
}
export = Runtime;

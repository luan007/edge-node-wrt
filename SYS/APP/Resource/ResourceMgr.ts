import _Disposable = require('./Disposable');
import Disposable = _Disposable.Disposable;

class ResourceMgr {
    static delimiter = '_';
    private _resources:{ [key: string]: Disposable; } = {};

    Register = (moduleName:string, appUid:string) => {
        var key = this.GenerateKey(appUid, moduleName);
        this._resources[key] = new Disposable(appUid, moduleName);
        return this._resources[key];
    }

    GenerateKey = (appUid:string, moduleName:string) => {
        return appUid + ResourceMgr.delimiter + moduleName;
    }
}

var resourceMgr = new ResourceMgr();
export = resourceMgr;
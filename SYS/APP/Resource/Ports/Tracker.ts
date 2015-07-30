eval(LOG("APP:Resource:Ports:Tracker"));

export interface PortStatus {
    Port: string;
    Priority: number;
    Stop: (cb: Callback) => any;
    Owner: string;
}

var cache: IDic<PortStatus> = {};

export function Initialize(cb) {
    //TODO: Add Opened Port here
    //      Should be none, for safety.
    cb();
}

export function Exist(port) {
    return cache.hasOwnProperty(port);
}

export function List() {
    return cache;
}

export function ListByOwner(owner) {
    var k = Object.keys(cache);
    var o = {};
    for (var i = 0; i < k.length; i++) {
        if (cache[k[i]].Owner === owner) {
            o[k[i]] = cache[k[i]];
        }
    } return o;
}

export function Get(port): PortStatus {
    return cache[port];
}

export function Use(port: PortStatus, cb) {
    if (!Exist(port.Port)) {
        cache[port.Port] = port;
        //cache[port] = 1;
        return cb(undefined, port);
    }
    else if ((port.Priority <= cache[port.Port].Priority && port.Owner !== cache[port.Port].Owner)
          || (port.Priority < cache[port.Port].Priority && port.Owner == cache[port.Port].Owner)) {
        return cb(new Error("Trying to replace an port with equal or higher priority :("));
    }
    else {
        Release(port.Port, (err) => {
            if (err) return cb(err);
            cache[port.Port] = port;
            return cb(undefined, port);
        });
    }
}

export function Release(port, cb) {
    var p = cache[port];
    if (!p) return cb(); //good
    else if (!cache[port].Stop) {
        return cb(new Error("This port is not removable"));
    }
    else {
        cache[port].Stop((err, result) => {
            if (err) {
                return cb(err);
            } else {
                __EMIT("Port.release", p.Port);
                delete cache[port];
                return cb(); //good
            }
        });
    }
}

export function ReleaseByOwner(owner, cb) {
    //try release everything
    var lst = ListByOwner(owner);
    async.each(Object.keys(lst), (port, cb) => {
        Release(lst, cb);
    }, cb);
}


__EVENT("Port.release", [Permission.PortExposure]);
__API(Release, "Port.Release", [Permission.System]);
__API((cb) => { return cb(undefined, List()); }, "Port.List", [Permission.System]);
__API((owner, cb) => { return cb(undefined, ListByOwner(owner)); }, "Port.ListByOwner", [Permission.System]);
__API((port, cb) => { return cb(undefined, Exist(port)); }, "Port.Exist", [Permission.PortExposure]);



function _cleanUp(runtimeId){
    ReleaseByOwner(runtimeId, () => { });
}

export function Subscribe(cb){

    var runtime = StatMgr.Sub(SECTION.RUNTIME);
    runtime.apps.on('set', (_key, _old, _new) => {
        if(_new.State < 0) {
            _cleanUp(_new.RuntimeId);
        }
    });
    cb();

}
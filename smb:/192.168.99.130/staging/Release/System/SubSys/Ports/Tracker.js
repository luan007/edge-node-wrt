var cache = {};
function Initialize(cb) {
    cb();
}
exports.Initialize = Initialize;
function Exist(port) {
    return cache.hasOwnProperty(port);
}
exports.Exist = Exist;
function List() {
    return cache;
}
exports.List = List;
function ListByOwner(owner) {
    var k = Object.keys(cache);
    var o = {};
    for (var i = 0; i < k.length; i++) {
        if (cache[k[i]].Owner === owner) {
            o[k[i]] = cache[k[i]];
        }
    }
    return o;
}
exports.ListByOwner = ListByOwner;
function Get(port) {
    return cache[port];
}
exports.Get = Get;
function Use(port, cb) {
    if (!Exist(port.Port)) {
        cache[port.Port] = port;
        return cb(undefined, port);
    }
    else if ((port.Priority <= cache[port.Port].Priority && port.Owner !== cache[port.Port].Owner) || (port.Priority < cache[port.Port].Priority && port.Owner == cache[port.Port].Owner)) {
        return cb(new Error("Trying to replace an port with equal or higher priority :("));
    }
    else {
        Release(port.Port, function (err) {
            if (err)
                return cb(err);
            cache[port.Port] = port;
            return cb(undefined, port);
        });
    }
}
exports.Use = Use;
function Release(port, cb) {
    var p = cache[port];
    if (!p)
        return cb();
    else if (!cache[port].Stop) {
        return cb(new Error("This port is not removable"));
    }
    else {
        cache[port].Stop(function (err, result) {
            if (err) {
                return cb(err);
            }
            else {
                __EMIT("Port.release", p.Port);
                delete cache[port];
                return cb();
            }
        });
    }
}
exports.Release = Release;
function ReleaseByOwner(owner, cb) {
    var lst = ListByOwner(owner);
    async.each(Object.keys(lst), function (port, cb) {
        Release(lst, cb);
    }, cb);
}
exports.ReleaseByOwner = ReleaseByOwner;
__EVENT("Port.release", [10 /* PortExposure */]);
__API(Release, "Port.Release", [0 /* System */]);
__API(function (cb) {
    return cb(undefined, List());
}, "Port.List", [0 /* System */]);
__API(function (owner, cb) {
    return cb(undefined, ListByOwner(owner));
}, "Port.ListByOwner", [0 /* System */]);
__API(function (port, cb) {
    return cb(undefined, Exist(port));
}, "Port.Exist", [10 /* PortExposure */]);

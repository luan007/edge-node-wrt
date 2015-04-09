var Core = require("Core");
var Device = Core.Device.DeviceManager;
var Data = Core.Data;
exports.DB_UserList = {};
exports.DB_Ticket = {};
exports.DeviceAlive = {};
exports.UserStatus = {};
function getTicket(authId) {
    return exports.DB_Ticket[authId];
}
function getUser(userId) {
    return exports.DB_UserList[userId];
}
function UserAppear(userid, ticket, device, expire, callback) {
    var usr = getUser(userid);
    var ath = getTicket(ticket);
    if (!usr) {
        Orbit.Get("User/", Orbit.PKG(ticket, device), function (err, u) {
            if (err) {
                return callback(err, null);
            }
            var _u = new Data.User();
            _u.name = u.name;
            _u.uid = u.uid;
            _u.data = u.data;
            Data.User.table().create(_u, function (err, usr) {
                if (err) {
                    return callback(err, null);
                }
                exports.DB_UserList[_u.uid] = usr;
                info("USER " + _u.name.bold + " CREATED");
                callback(null, usr);
            });
        });
    }
    if (!ath) {
        var _a = new Data.Ticket();
        _a.device_uid = device;
        _a.expire = expire / 1.5 + new Date().getTime();
        _a.owner_uid = usr.uid;
        _a.owner = usr;
        _a.uid = ticket;
        Data.Ticket.table().create(_a, function (err, ath) {
            if (err) {
                return callback(err, null);
            }
            exports.DB_Ticket[ticket] = ath;
            info("TICKET " + _a.uid.bold + " CREATED");
            callback(null, usr);
        });
    }
    Core.Device.DeviceManager.SetOwnership(device, userid);
}
exports.UserAppear = UserAppear;
function Login(identity, password, deviceid, callback) {
    Orbit.Post("Ticket", Orbit.PKG(undefined, deviceid, {
        id: identity,
        pass: password
    }), function (err, result) {
        error(err);
        if (err && err.code == 5 /* DEVICE_NOT_FOUND */ && !callback["retry"]) {
            Core.Device.DeviceManager.OrbitSync(deviceid, function (err, result) {
                if (err) {
                    error(err);
                    return callback(err);
                }
                callback["retry"] = true;
                Login(identity, password, deviceid, callback);
            });
        }
        else if (err) {
            return callback(err);
        }
        else {
            UserAppear(result.owner_uid, result.accessToken, deviceid, result.expire, function (err, user) {
                return callback(err, user ? {
                    atoken: result.accessToken,
                    rtoken: result.refreshToken,
                    user: {
                        data: user.data,
                        name: user.name,
                        uid: user.uid
                    }
                } : undefined);
            });
        }
    });
}
exports.Login = Login;
function Logout(atoken, callback) {
    if (exports.DB_Ticket[atoken]) {
        exports.DB_Ticket[atoken].remove(callback);
    }
    else {
        return callback(new Error("Not Found"));
    }
}
exports.Logout = Logout;
function Register(name, email, password, cb) {
    Orbit.Post("User", { name: name, email: email, password: password }, cb);
}
exports.Register = Register;
function Renew(atoken, rtoken, deviceid, callback) {
    Orbit.Put("Ticket", Orbit.PKG(atoken, deviceid, {
        rtoken: rtoken
    }), function (err, result) {
        error(err);
        if (err)
            return callback(err);
        UserAppear(result.owner_uid, result.accessToken, deviceid, result.expire, function (err, user) {
            return callback(err, {
                atoken: result.accessToken,
                rtoken: result.refreshToken,
                user: {
                    data: user.data,
                    name: user.name,
                    uid: user.uid
                }
            });
        });
    });
}
exports.Renew = Renew;
function GetCurrentUserId(auth) {
    if (!has(exports.DB_Ticket, auth)) {
        return undefined;
    }
    var a = exports.DB_Ticket[auth];
    if (a.expire < new Date().getTime()) {
        a.remove(function (err) {
        });
        delete exports.DB_Ticket[auth];
        return undefined;
    }
    return a.owner_uid;
}
exports.GetCurrentUserId = GetCurrentUserId;
function LoadFromDB() {
    trace("Load Users");
    exports.DB_UserList = {};
    exports.DB_Ticket = {};
    Data.User.table().all({}, function (err, _users) {
        _users.forEach(function (user, i, all) {
            exports.DB_UserList[user.uid] = user;
        });
        trace("Load AuthTickets");
        Data.Ticket.table().all({}, function (err, _auth) {
            for (var t = 0; t < _auth.length; t++) {
                var ticket = _auth[t];
                exports.DB_Ticket[ticket.uid] = ticket;
                ticket.owner = exports.DB_UserList[ticket.owner_uid];
            }
            info((_users.length + " USER(S)").bold);
            info((_auth.length + " TICKET(S)").bold);
        });
    });
}
exports.LoadFromDB = LoadFromDB;
function AuthPatrolThread() {
    var time = new Date().getTime();
    for (var i in exports.DB_Ticket) {
        if (!has(exports.DB_Ticket, i))
            continue;
        var a = exports.DB_Ticket[i];
        if ((CONF.IS_DEBUG && CONF.USER_IMMEDIATE_EXPIRE) || a.expire < time) {
            trace("SESSION EXPIRED - " + a.owner.name.bold + " - PATROL");
            a.remove(function (err) {
                if (err)
                    error(err, "ERR REMOVING AUTHTICKET - PATROL");
            });
            delete exports.DB_Ticket[i];
        }
    }
}
exports.AuthPatrolThread = AuthPatrolThread;
function GetState(userid) {
    return exports.UserStatus[userid] ? exports.UserStatus[userid] : 0;
}
exports.GetState = GetState;
function GetUser(userid) {
    return exports.DB_UserList[userid];
}
exports.GetUser = GetUser;
function List(opts) {
    opts = opts || {};
    var results = {};
    for (var i in exports.DB_UserList) {
        if ((opts.state === undefined || (opts.state === GetState(i)))) {
            results[i] = exports.DB_UserList[i];
        }
    }
    return results;
}
exports.List = List;
function All() {
    return exports.DB_UserList;
}
exports.All = All;
function GetOwnedDevices(user, ops) {
    ops = ops || {};
    var usr = GetUser(user);
    if (!usr) {
        return {};
    }
    else {
        return Device.List({
            bus: ops.bus,
            owner: user,
            state: ops.state
        });
    }
}
exports.GetOwnedDevices = GetOwnedDevices;
function _UpdateOnlineState(userid) {
    if (userid && userid !== "") {
        var curState = exports.UserStatus[userid] || 0;
        var newState = exports.DeviceAlive[userid] ? Object.keys(exports.DeviceAlive[userid]).length : 0;
        if (newState > 0 && curState === 0) {
            exports.UserStatus[userid] = 1;
            __EMIT("User.up", userid, exports.DB_UserList[userid]);
        }
        else if (curState === 1 && newState === 0) {
            exports.UserStatus[userid] = 0;
            exports.DB_UserList[userid].lastSeen = new Date();
            exports.DB_UserList[userid].save();
            __EMIT("User.down", userid, exports.DB_UserList[userid]);
        }
        else if (curState !== newState) {
            __EMIT("User.onlineDeviceChanged", userid, exports.DB_UserList[userid], exports.DeviceAlive[userid]);
        }
    }
}
function _DeviceOnwershipTransfer(devid, dev, newOwner, oldOwner) {
    if (dev && oldOwner && oldOwner !== "" && exports.DB_UserList[oldOwner]) {
        if (!exports.DeviceAlive[oldOwner]) {
            exports.DeviceAlive[oldOwner] = {};
        }
        else if (exports.DeviceAlive[dev.owner][dev.id]) {
            delete exports.DeviceAlive[dev.owner][dev.id];
        }
    }
    if (dev && newOwner && newOwner !== "" && exports.DB_UserList[newOwner] && dev.state > 0) {
        if (!exports.DeviceAlive[newOwner]) {
            exports.DeviceAlive[newOwner] = {};
        }
        exports.DeviceAlive[newOwner][dev.id] = dev;
    }
    _UpdateOnlineState(newOwner);
    if (oldOwner !== newOwner)
        _UpdateOnlineState(oldOwner);
}
function _DeviceOnline(devId, dev) {
    if (dev && dev.owner && exports.DB_UserList[dev.owner]) {
        if (!exports.DeviceAlive[dev.owner]) {
            exports.DeviceAlive[dev.owner] = {};
        }
        if (!exports.DeviceAlive[dev.owner][dev.id]) {
            exports.DeviceAlive[dev.owner][dev.id] = dev;
            _UpdateOnlineState(dev.owner);
        }
    }
}
function _DeviceOffline(devId, dev) {
    if (dev && dev.owner && exports.DB_UserList[dev.owner]) {
        if (!exports.DeviceAlive[dev.owner]) {
            exports.DeviceAlive[dev.owner] = {};
        }
        else {
            delete exports.DeviceAlive[dev.owner][dev.id];
            _UpdateOnlineState(dev.owner);
        }
    }
}
function Initialize(callback) {
    trace("Init..");
    LoadFromDB();
    trace("Starting AuthTicket Patrol " + (CONF.USERAUTH_PATROL_INTERVAL + "")["cyanBG"].bold);
    setInterval(AuthPatrolThread, CONF.USERAUTH_PATROL_INTERVAL);
    trace("UP");
    Device.Events.on("up", _DeviceOnline);
    Device.Events.on("down", _DeviceOffline);
    Device.Events.on("transfer", _DeviceOnwershipTransfer);
    return callback();
}
exports.Initialize = Initialize;
__API(Login, "Launcher.Login", [13 /* Launcher */]);
__API(Register, "Launcher.Register", [13 /* Launcher */]);
__API(Logout, "Launcher.Logout", [13 /* Launcher */]);
__API(Renew, "Launcher.Renew", [13 /* Launcher */]);
__API(withCb(GetOwnedDevices), "User.GetOwnedDevices", [5 /* UserAccess */, 4 /* DeviceAccess */]);
__API(withCb(List), "User.List", [5 /* UserAccess */]);
__API(withCb(All), "User.All", [5 /* UserAccess */]);
__API(withCb(GetUser), "User.Get", [5 /* UserAccess */]);
__API(withCb(GetState), "User.GetState", [5 /* UserAccess */]);
__EVENT("User.up", [5 /* UserAccess */]);
__EVENT("User.down", [5 /* UserAccess */]);
__EVENT("User.onlineDeviceChanged", [5 /* UserAccess */, 4 /* DeviceAccess */]);

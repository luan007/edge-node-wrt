//IMPLEMENT LIST USER / ADD USER / REMOVE USER

/*
    *mostly* copied from last rev (rev_1)
*/

import Core = require("Core");
import Node = require("Node");

import Device = Core.Device.DeviceManager;
import Data = Core.Data;
import Storage = Data.Storage;

export var DB_UserList: IDic<Data.IUser> = {};
export var DB_Ticket: IDic<Data.ITicket> = {};

export var DeviceAlive: IDic<IDic<IDevice>> = {};
export var UserStatus: IDic<number> = {};


/* abstracted for future replacement */
function getTicket(authId) {
    return DB_Ticket[authId];
}

/* abstracted for future replacement */
function getUser(userId) {
    return DB_UserList[userId];
}

export function UserAppear(
    userid: string,
    ticket: string,
    device: string,
    expire: number,
    callback: PCallback<Data.IUser>) {

    var usr = getUser(userid);
    var ath = getTicket(ticket);
    if (!usr) { // local user does not exist
        //Query for username and all sort
        Orbit.Get("User/", Orbit.PKG(ticket, device),(err, u: {
            name;
            uid;
            data;
        }) => {
            if (err) {
                return callback(err, null);
            }
            var _u = new Data.User();
            _u.name = u.name;
            _u.uid = u.uid;
            _u.data = u.data;
            Data.User.table().create(_u,(err, usr) => {
                if (err) {
                    return callback(err, null);
                }
                DB_UserList[_u.uid] = usr;
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
        Data.Ticket.table().create(_a,(err, ath) => {
            if (err) {
                return callback(err, null);
            }
            DB_Ticket[ticket] = ath;
            info("TICKET " + _a.uid.bold + " CREATED");
            callback(null, usr);
        });
    }

    Core.Device.DeviceManager.SetOwnership(device, userid);

}

export function Login(
    identity: string,
    password: string,
    deviceid: string,
    callback: (err, result?) => any) {

    Orbit.Post("Ticket", Orbit.PKG(undefined, deviceid, {
        id: identity,
        pass: password
    }),(err, result) => {
            error(err);
            if (err && err.code == ErrorCode.DEVICE_NOT_FOUND && !callback["retry"]) {
                Core.Device.DeviceManager.OrbitSync(deviceid,(err, result) => {
                    if (err) {
                        error(err);
                        return callback(err);
                    }
                    callback["retry"] = true;
                    Login(identity, password, deviceid, callback);
                });
            } else if (err) {
                return callback(err);
            } else {
                UserAppear(
                    result.owner_uid,
                    result.accessToken,
                    deviceid,
                    result.expire,(err, user) => {
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

export function Logout(
    atoken: string,
    callback: (err) => any) {

    //clean local entries
    if (DB_Ticket[atoken]) {
        DB_Ticket[atoken].remove(callback);
    } else {
        return callback(new Error("Not Found"));
    }

}

export function Register(name, email, password, cb) {
    Orbit.Post("User", { name: name, email: email, password: password }, cb);
}

export function Renew(
    atoken: string,
    rtoken: string,
    deviceid: string,
    callback: (err, result?) => any) {

    Orbit.Put("Ticket", Orbit.PKG(atoken, deviceid, {
        rtoken: rtoken
    }),(err, result) => {
            error(err);
            if (err) return callback(err);
            UserAppear(
                result.owner_uid,
                result.accessToken,
                deviceid,
                result.expire,(err, user) => {
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

//Called in AuthServer
export function GetCurrentUserId(auth: string) {
    if (!has(DB_Ticket, auth)) {
        return undefined;
    }
    var a = DB_Ticket[auth];
    if (a.expire < new Date().getTime()) {
        a.remove((err) => {
        });
        delete DB_Ticket[auth];
        return undefined;
    }
    return a.owner_uid;
}

export function LoadFromDB() {
    trace("Load Users");
    DB_UserList = {};
    DB_Ticket = {};
    Data.User.table().all({},(err, _users) => {
        _users.forEach((user, i, all) => {
            DB_UserList[user.uid] = user;
        });
        trace("Load AuthTickets");
        Data.Ticket.table().all({},(err, _auth) => {
            for (var t = 0; t < _auth.length; t++) {
                var ticket = _auth[t];
                DB_Ticket[ticket.uid] = ticket;
                ticket.owner = DB_UserList[ticket.owner_uid];
            }
            info((_users.length + " USER(S)").bold);
            info((_auth.length + " TICKET(S)").bold);
        });
    });
}

export function AuthPatrolThread() {
    var time = new Date().getTime();
    for (var i in DB_Ticket) {
        if (!has(DB_Ticket, i)) continue;
        var a = DB_Ticket[i];
        if ((CONF.IS_DEBUG && CONF.USER_IMMEDIATE_EXPIRE) || a.expire < time) {
            trace("SESSION EXPIRED - " + a.owner.name.bold + " - PATROL");
            a.remove((err) => {
                if (err)
                    error(err, "ERR REMOVING AUTHTICKET - PATROL");
            });
            delete DB_Ticket[i];
        }
    }
}

export function GetState(userid) {
    return UserStatus[userid] ? UserStatus[userid] : 0;
}

export function GetUser(userid) {
    return DB_UserList[userid];
}

export function List(opts: {
    state?: number
}) {
    opts = opts || {};
    var results = {};
    for (var i in DB_UserList) {
        if ((opts.state === undefined || 
            (opts.state === GetState(i)))) {
            results[i] = DB_UserList[i];
        }
    }
    return results;
}

export function All() {
    return DB_UserList;
}

export function GetOwnedDevices(user, ops: {
    state?: number;
    bus?: string | string[];
}) {
    ops = ops || {};
    var usr = GetUser(user);
    if (!usr) {
        return {};
    } else {
        return Device.List({
            bus: ops.bus,
            owner: user,
            state: ops.state
        });
    }
}

function _UpdateOnlineState(userid) {
    if (userid && userid !== "") {
        var curState = UserStatus[userid] || 0;
        var newState = DeviceAlive[userid] ? Object.keys(DeviceAlive[userid]).length : 0;
        if (newState > 0 && curState === 0) {
            UserStatus[userid] = 1;
            __EMIT("User.up", userid, DB_UserList[userid]);
        } else if (curState === 1 && newState === 0) {
            UserStatus[userid] = 0;
            DB_UserList[userid].lastSeen = new Date();
            DB_UserList[userid].save();
            __EMIT("User.down", userid, DB_UserList[userid]);
        } else if (curState !== newState) {
            __EMIT("User.onlineDeviceChanged", userid, DB_UserList[userid], DeviceAlive[userid]);
        }
    }
}

function _DeviceOnwershipTransfer(devid, dev: IDevice, newOwner, oldOwner) {
    if (dev && oldOwner && oldOwner !== "" && DB_UserList[oldOwner]) {
        if (!DeviceAlive[oldOwner]) {
            DeviceAlive[oldOwner] = {};
        }
        else if (DeviceAlive[dev.owner][dev.id]) {
            delete DeviceAlive[dev.owner][dev.id];
        }
    }
    if (dev && newOwner && newOwner !== "" && DB_UserList[newOwner]
        && dev.state > 0) {
        if (!DeviceAlive[newOwner]) {
            DeviceAlive[newOwner] = {};
        }
        DeviceAlive[newOwner][dev.id] = dev;
    }
    _UpdateOnlineState(newOwner);
    if (oldOwner !== newOwner) _UpdateOnlineState(oldOwner);
}

function _DeviceOnline(devId, dev: IDevice) {
    if (dev && dev.owner && DB_UserList[dev.owner]) {
        if (!DeviceAlive[dev.owner]) {
            DeviceAlive[dev.owner] = {};
        }
        if (!DeviceAlive[dev.owner][dev.id]) {
            DeviceAlive[dev.owner][dev.id] = dev;
            _UpdateOnlineState(dev.owner);
        }
    }
}

function _DeviceOffline(devId, dev: IDevice) {
    if (dev && dev.owner && DB_UserList[dev.owner]) {
        if (!DeviceAlive[dev.owner]) {
            DeviceAlive[dev.owner] = {};
        }
        else {
            delete DeviceAlive[dev.owner][dev.id];
            _UpdateOnlineState(dev.owner);
        }
    }
}

export function Initialize(callback: Callback) {
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

__API(Login, "Launcher.Login", [Permission.Launcher]);
__API(Register, "Launcher.Register", [Permission.Launcher]);
__API(Logout, "Launcher.Logout", [Permission.Launcher]);
__API(Renew, "Launcher.Renew", [Permission.Launcher]);

__API(withCb(GetOwnedDevices), "User.GetOwnedDevices", [Permission.UserAccess, Permission.DeviceAccess]);
__API(withCb(List), "User.List", [Permission.UserAccess]);
__API(withCb(All), "User.All", [Permission.UserAccess]);
__API(withCb(GetUser), "User.Get", [Permission.UserAccess]);
__API(withCb(GetState), "User.GetState", [Permission.UserAccess]);
__EVENT("User.up", [Permission.UserAccess]);
__EVENT("User.down", [Permission.UserAccess]);
__EVENT("User.onlineDeviceChanged", [Permission.UserAccess, Permission.DeviceAccess]);

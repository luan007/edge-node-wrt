//IMPLEMENT LIST USER / ADD USER / REMOVE USER

/*
    *mostly* copied from last rev (rev_1)
*/

import Core = require("Core");
import Node = require("Node");

import Data = Core.Data;
import Storage = Data.Storage;

export var DB_UserList: IDic<Data.IUser> = {};
export var DB_Ticket: IDic<Data.ITicket> = {};

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
        _a.expire = expire / 10 + new Date().getTime();
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
                    error(err);
                    if (err) return callback(err);
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

export function Initialize(callback: Callback) {
    trace("Init..");
    LoadFromDB();
    trace("Starting AuthTicket Patrol " + (CONF.USERAUTH_PATROL_INTERVAL + "")["cyanBG"].bold);
    setInterval(AuthPatrolThread, CONF.USERAUTH_PATROL_INTERVAL);
    trace("UP");
    return callback();
}

__API(Login, "Launcher.Login", [Permission.Launcher]);

__API(Logout, "Launcher.Logout", [Permission.Launcher]);

__API(Renew, "Launcher.Renew", [Permission.Launcher]);
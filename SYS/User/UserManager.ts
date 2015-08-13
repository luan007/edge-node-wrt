eval(LOG("User:UserManager"));

//IMPLEMENT LIST USER / ADD USER / REMOVE USER

/*
 *mostly* copied from last rev (rev_1)
 */

import DeviceManager = require('../Device/DeviceManager');
import Device = DeviceManager;
import Storage = require('../DB/Storage');
import _User = require('../DB/Models/User');
import User = _User.User;
import IUser = _User.IUser;
import _ITicket = require('../DB/Models/Ticket');
import ITicket = _ITicket.ITicket;
import Ticket = _ITicket.Ticket;
import StatBiz = require('../Common/Stat/StatBiz');

export var DB_UserList:IDic<IUser> = {};
export var DB_Ticket:IDic<ITicket> = {};

export var DeviceAlive:IDic<IDic<IDevice>> = {};

var pub = StatMgr.Pub(SECTION.USER, {
    online: {}
});

/* Implement a local 'Orbit Login' for Pin-usages */
var pinStore = {};
var pinTokenStore = {};

function pinStorePatrol(){
    //pinStore
    //tokenStore
    var now = Date.now();
    for(var i in pinStore){
        if(pinStore[i].timeout < now){
            delete pinStore[i];
        }
    }
    for(var i in pinTokenStore){
        if(pinTokenStore[i].expire < now){
            delete pinTokenStore[i];
        }
    }
}

export function CreatePin(deviceid: string, callback){
    for(var i in pinStore){
        if(pinStore[i].dev === deviceid){
            delete pinStore[i];
        }
    }
}

export function PinLogin(pin: string,
                         deviceid:string,
                         callback:(err, result?) => any){
                             
    if(pinStore[pin] && pinStore[pin].dev === deviceid){
        var atoken = UUIDstr();
        var rtoken = UUIDstr();
        var token = {
            atoken: UUIDstr(),
            rtoken: UUIDstr(),
            dev: deviceid,
            expire: CONF.PIN_TOKEN_EXPIRE + Date.now()
        };
        pinTokenStore[token.atoken] = token;
        var _a = new Ticket();
            _a.device_uid = deviceid;
            _a.expire = CONF.PIN_TICKET_EXPIRE + Date.now();
            _a.owner_uid = undefined;
            _a.owner = undefined;
            _a.uid = token.atoken;
        Ticket.table().create(_a, (err, ath) => {
             if (err) {
                 return callback(err, null);
             }
             DB_Ticket[atoken] = ath;
             info("TICKET " + _a.uid.bold + " CREATED");
             callback(undefined, {
                             atoken: atoken,
                             rtoken: rtoken,
                             user: undefined});
        });
    }
    
    return callback(new Error("Wrong Pin"));
}

function __uploadDevice (devId, cb) {
    var db_devices = DeviceManager.DB_Devices;
    if (!has(db_devices, devId)) {
        process.nextTick(cb.bind(null, new Error("Device not found")));
    }
    info('< --------- < Upload to orbit, dev', devId);
    Orbit.UploadDevice(devId, db_devices[devId].busname, db_devices[devId].hwaddr, db_devices[devId], cb);
}

export function Login(identity:string,
                      password:string,
                      deviceid:string,
                      callback:(err, result?) => any) {
    Orbit.Post("Ticket", Orbit.PKG(undefined, deviceid, {
        id: identity,
        pass: password
    }), (err, result) => {
        if (err) {
            if (err.code == ErrorCode.DEVICE_NOT_FOUND && !callback["retry"]) {
                __uploadDevice(deviceid, (err, result) => {
                    if (err) {
                        error(err);
                        return callback(err);
                    }
                    callback["retry"] = true;
                    Login(identity, password, deviceid, callback);
                });
            } else {
                error(err);
                return callback(err);
            }
        } else {
            UserAppear(
                result.owner_uid,
                result.accessToken,
                deviceid,
                result.expire, (err, user) => {
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

export function Logout(atoken:string,
                       callback:(err) => any) {

    //clean local entries
    if (DB_Ticket[atoken]) {
        DB_Ticket[atoken].remove(callback);
        delete DB_Ticket[atoken];
    } else {
        return callback(new Error("Not Found"));
    }

}

export function Register(name, email, password, cb) {
    Orbit.Post("User", {name: name, email: email, password: password}, cb);
}

export function Renew(atoken:string,
                      rtoken:string,
                      deviceid:string,
                      callback:(err, result?) => any) {
    if(getTicket(atoken) && getTicket(atoken).owner_uid === undefined) {
        //Pinbased          
        if(!pinTokenStore[atoken]) return callback(new Error("Invalid Pinbased Token"));    
        if(pinTokenStore[atoken].dev === deviceid && 
           pinTokenStore[atoken].rtoken === rtoken){
            delete pinTokenStore[atoken];
            Logout(atoken, ()=>{});
            var atoken = UUIDstr();
            var rtoken = UUIDstr();
            var token = {
                atoken: UUIDstr(),
                rtoken: UUIDstr(),
                dev: deviceid,
                expire: CONF.PIN_TOKEN_EXPIRE + Date.now()
            };
            pinTokenStore[token.atoken] = token;
            var _a = new Ticket();
                _a.device_uid = deviceid;
                _a.expire = CONF.PIN_TICKET_EXPIRE + Date.now();
                _a.owner_uid = undefined;
                _a.owner = undefined;
                _a.uid = token.atoken;
            Ticket.table().create(_a, (err, ath) => {
                if (err) {
                    return callback(err, null);
                }
                DB_Ticket[atoken] = ath;
                info("PIN TICKET " + _a.uid.bold + " CREATED");
                callback(undefined, {
                                atoken: atoken,
                                rtoken: rtoken,
                                user: undefined});
            });
        }
    }
    else 
    {
        Orbit.Put("Ticket", Orbit.PKG(atoken, deviceid, {
            rtoken: rtoken
        }), (err, result) => {
            error(err);
            if (err) return callback(err);
            UserAppear(
                result.owner_uid,
                result.accessToken,
                deviceid,
                result.expire, (err, user) => {
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
}

/* abstracted for future replacement */
function getTicket(authId) {
    return DB_Ticket[authId];
}

/* abstracted for future replacement */
function getUser(userId) {
    return DB_UserList[userId];
}

export function UpdateAvatar(userid:string, avatar:string, cb){
    User.table().one({uid:userid}, (err, user)=>{
        if(err) return cb(err);
        user.avatar = avatar;
        user.version = user.version + 1;
        return user.save(cb);
    });
}

export function UpdateData(userid:string, data, cb){
    User.table().one({uid:userid}, (err, user)=>{
        if(err) return cb(err);
        user.data = JSON.stringify(data);
        user.version = user.version + 1;
        return user.save(cb);
    });
}

export function SyncUser(userid:string, cb) {
    var user = DB_UserList[userid];
    var pkg = Orbit.PKG(undefined, undefined, JSON.parse(JSON.stringify(user)));

    Orbit.Post('User/sync', pkg, (err, orbitResult)=> {
        if (err) return cb(err);
        if (orbitResult.state === 'OK') return cb();
        if (orbitResult.state === 'DOWN') {
            if (orbitResult.avatar_diff) {
                Orbit.Download('User/avatar/download/' + orbitResult.entity.avatar, {uid: user.uid,}, (err, stream)=> {
                    if (!fs.existsSync(CONF.AVATAR_PATH))
                        fs.mkdirSync(CONF.AVATAR_PATH);

                    var avatarPath = path.join(CONF.AVATAR_PATH, orbitResult.entity.avatar);
                    var wstream = fs.createWriteStream(avatarPath);
                    stream.pipe(wstream);
                    stream.on('end', ()=> {
                        user.avatar = orbitResult.entity.avatar;
                        user.version = orbitResult.entity.version;
                        user.save();
                        var oldAvatarPath = path.join(CONF.AVATAR_PATH, user.avatar);
                        fs.unlink(oldAvatarPath);
                    });
                    stream.on('error', console.log);
                });
            }
            return cb();
        } else if (orbitResult.state === 'UP') {
            if (orbitResult.avatar_diff) {
                if (!fs.existsSync(CONF.AVATAR_PATH)) fs.mkdirSync(CONF.AVATAR_PATH);
                var avatarPath = path.join(CONF.AVATAR_PATH, user.avatar);
                fs.readFile(avatarPath, (err, avatar_data)=> {
                    if (err) return cb(err);
                    Orbit.Post('User/avatar/upload/' + orbitResult.entity.avatar
                        , Orbit.PKG(undefined, {uid: user.uid, version: user.version, avatar_data: avatar_data})
                        , cb);
                });
            }
            return cb();
        }
    });
}

export function UserAppear(userid:string,
                           ticket:string,
                           device:string,
                           expire:number,
                           callback:PCallback<IUser>) {
    callback = <any>once(<any>callback);
    var usr = getUser(userid);
    var ath = getTicket(ticket);
    if (!usr) { // local user does not exist
        //Query for username and all sort
        Orbit.Get("User/", Orbit.PKG(ticket, device), (err, u:{
            name;
            uid;
            data;
            version;
            avatar;
        }) => {
            if (err) {
                return callback(err, null);
            }

            var _u = new User();
            _u.name = u.name;
            _u.uid = u.uid;
            _u.data = JSON.stringify(u.data);
            _u.version = u.version;
            _u.avatar = u.avatar;
            User.table().create(_u, (err, usr) => {
                if (err) {
                    return callback(err, null);
                }
                DB_UserList[_u.uid] = usr;
                info("USER " + _u.name.bold + " CREATED");
                callback(null, usr);
            });
            Orbit.Download('User/avatar/download/' + _u.avatar, {}, (err, data)=> {
                if(!fs.existsSync(CONF.AVATAR_PATH))
                    fs.mkdirSync(CONF.AVATAR_PATH);

                var avatarFileName = path.join(CONF.AVATAR_PATH, _u.avatar);
                fs.writeFile(avatarFileName, data);
            });
        });
    } else {
        SyncUser(userid, ()=>{
            console.log("< ======= > USER " + userid + " SYNC was completed.");
        });
    }
    if (!ath) {
        var _a = new Ticket();
        _a.device_uid = device;
        _a.expire = expire / 1.5 + new Date().getTime();
        _a.owner_uid = usr.uid;
        _a.owner = usr;
        _a.uid = ticket;
        Ticket.table().create(_a, (err, ath) => {
            if (err) {
                return callback(err, null);
            }
            DB_Ticket[ticket] = ath;
            info("TICKET " + _a.uid.bold + " CREATED");
            callback(null, usr);
        });
    }

    DeviceManager.SetOwnership(device, userid); //yep

}



export function LoadFromDB() {
    trace("Load Users");
    DB_UserList = {};
    DB_Ticket = {};
    User.table().all({}, (err, _users) => {
        _users.forEach((user, i, all) => {
            DB_UserList[user.uid] = user;
        });
        trace("Load AuthTickets");
        Ticket.table().all({}, (err, _auth) => {
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
    pinStorePatrol();
}

export function GetState(userid) {
    return StatBiz.GetUserState(userid);
}

export function GetUser(userid) {
    return DB_UserList[userid];
}

export function List(opts:{
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

export function GetOwnedDevices(user, ops:{
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
        var curState = StatBiz.GetUserState(userid) || 0;
        var newState = DeviceAlive[userid] ? Object.keys(DeviceAlive[userid]).length : 0;
        if (newState > 0 && curState === 0) {
            pub.online.Set(userid, 1);
            __EMIT("User.up", userid, DB_UserList[userid]);
        } else if (curState === 1 && newState === 0) {
            pub.online.Del(userid);
            DB_UserList[userid].lastSeen = new Date();
            DB_UserList[userid].save();
            __EMIT("User.down", userid, DB_UserList[userid]);
        } else if (curState !== newState) {
            __EMIT("User.onlineDeviceChanged", userid, DB_UserList[userid], DeviceAlive[userid]);
        }
    }
}

function _DeviceOnwershipTransfer(devid, dev:IDevice, newOwner, oldOwner) {
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

function _DeviceOnline(devId, dev:IDevice) {
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

function _DeviceOffline(devId, dev:IDevice) {
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

export function Initialize(callback:Callback) {
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

function GetCurrentUser(cb) {
    if(!this.userid || !DB_UserList[this.userid]) return cb();
    return cb(undefined, {
         name: DB_UserList[this.userid].name,
         data: DB_UserList[this.userid].data,
         lastSeen: DB_UserList[this.userid].lastSeen
    });
    return cb(new Error('No logon'));
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
__API(UpdateAvatar, "User.UpdateAvatar", [Permission.UserAccess]);
__API(UpdateData, "User.UpdateData", [Permission.UserAccess]);

__API(GetCurrentUser, "User.GetCurrent", [Permission.UserAccess], true);

__EVENT("User.up", [Permission.UserAccess]);
__EVENT("User.down", [Permission.UserAccess]);
__EVENT("User.onlineDeviceChanged", [Permission.UserAccess, Permission.DeviceAccess]);

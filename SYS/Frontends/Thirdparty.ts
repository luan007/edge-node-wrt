import UserManager = require("../User/UserManager");
import DeviceManager = require("../Device/DeviceManager");
import Storage = require('../DB/Storage');

var cache = {};

//inline
function getstore(src_key, target, do_not_create?) {
    if (!cache[target]) {
        var dev = UserManager.DB_UserList[target] || DeviceManager.DB_Devices[target];
        if(!dev) throw new Error("Target Id is not Valid - " + target);
        try {
            cache[target] = JSON.parse(dev.thirdparty);
        } catch(e) {
            cache[target] = {};
        }
    }
    if (!do_not_create && !cache[target][src_key]) {
        cache[target][src_key] = {
            primary: {},
            aux: {}
        };
    }
    return cache[target][src_key];
}

function save(target){
    var dev = UserManager.DB_UserList[target] || DeviceManager.DB_Devices[target];
    if(!dev) throw new Error("Target Id is not Valid - " + target);
    dev.thirdparty = JSON.stringify(cache[target]);
    dev.save();
}

export function Primary(source_key, target, data?) {
    target = getstore(source_key, target);
    if(!data){
        return target.primary;
    }
    target.primary = data;
    save(target);
}

export function Aux(source_key, target, data?) {
    target = getstore(source_key, target);
    if(!data){
        return target.aux;
    }
    target.aux = data;
    save(target);
}

export function Owned(source_key) {
    var ret = { users: {}, devices: {} };
    for(var k in UserManager.DB_UserList){
        var data = getstore(source_key, k, true);
        if(data) ret.users[k] = data;
    }
    for(var k in DeviceManager.DB_Devices){
        var data = getstore(source_key, k, true);
        if(data) ret.devices[k] = data;
    }
    return ret;
}

export function Clear(source_key) {
    for(var k in UserManager.DB_UserList){
        var data = getstore(source_key, k, true);
    }
    for(var k in DeviceManager.DB_Devices){
        if(getstore(source_key, k, true)){
            delete cache[k][source_key];
            save(k);
        }
    }
    for(var k in UserManager.DB_UserList){
        if(getstore(source_key, k, true)){
            delete cache[k][source_key];
            save(k);
        }
    }
}

__API(withCb(Primary), "Thirdparty.Primary", [Permission.AnyApp]);
__API(withCb(Aux), "Thirdparty.Aux", [Permission.AnyApp]);
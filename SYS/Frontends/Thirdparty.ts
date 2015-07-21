import UserManager = require("../User/UserManager");
import DeviceManager = require("../Device/DeviceManager");
import Storage = require('../DB/Storage');

var cache = {};

//inline
function getstore(src_key, target) {
    if(!cache[target]){
        var dev = UserManager.DB_UserList[target] || DeviceManager.DB_Devices[target];
        if(!dev) throw new Error("Target Id is not Valid - " + target);
        cache[target] = JSON.parse(dev.thirdparty);
    }
    if(!cache[src_key]){
        cache[src_key] = {
            primary: {},
            aux: {}
        };
    }
    return cache[src_key];
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
    target.primary = data;
    save(target);
}

export function Owned(source_key) {
    //{ Users, Devices }
}

export function Clear(source_key, target) {
    
}

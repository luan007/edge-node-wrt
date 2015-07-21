//Map / Compress Permission settings

/*
 *  Permission Mapping Scheme:
 *  
 *  [SYSTEM, IO, ... , <nth param>] with length X
 *                |
 *                |   PERMISSION TO BIT CONVERSION TABLE
 *                v
 *    [ num, num, num, ..., num] with length X/32
 *       |
 *       v
 *     32-bit  
 * [0 1 0 .. 1 0 0 0 0]     
 *       
 */

//Current Performance (Check):
//10000000 times : <50ms
//Memory Occupation (Encode):
//10000 Objects  : <5mb

require("./PermissionDef");

var PermissionTable = {};
var _sys_perm = Encode([Permission.System]);
SetPermission(0, _sys_perm)

export function SetPermission(id, buffer: number[]) {
    PermissionTable[id] = Encode(Decode(buffer));
}

export function GetPermission(id): any[]{
    return PermissionTable[id];
}

var _permission_buffer_length = Math.ceil((Object.keys(Permission).length / 2) / 32); //hacked from ts's compiler
var _perm_length = (Object.keys(Permission).length / 2);

/*Generate Groups*/
var _GROUP_SYSTEM = _.range(_perm_length);
    //Array["apply"](null, { length: _perm_length }).map(Number["call"], Number);

//get processed permission if there're any ... sp in it
function Resolve(raw_p?: Permission[]): any[] {
    if (!raw_p)
        return undefined; //space saving.

    for (var i = 0; i < raw_p.length; i++) {
        switch (raw_p[i]) {
            case Permission.System:
                return (_GROUP_SYSTEM);
                break;
            default:
                break;
        }
    }
    return raw_p;
}


export function Encode(permissions?: Permission[]): any[] {
    if (!permissions)
        return undefined; //space saving.

    permissions = Resolve(permissions);

    var buf = new Array(_permission_buffer_length); //[]; //new Array() Leaks
    for (var i = 0; i < buf.length; i++) {
        buf[i] = 0;
    }
    for (var i = 0; i < permissions.length; i++) {
        var bitIndex = permissions[i];
        buf[Math.floor(bitIndex / 32)] |= 1 << (bitIndex % 32); //flip bit
    }

    return buf;
}

/*Rarely Used*/
//TODO: Test Permission.Decode
export function Decode(permissions?: any[]): Permission[] {
    var p = [];
    if (!permissions)
        return p;
    for (var i = 0; i < permissions.length; i++) {
        for (var j = 0; j < 32; j++) {
            if ((permissions[i] & (1 << j)) != 0) {
                p.push(Permission[Permission[i * 32 + j]]);
            }
        }
    }
    return p;
}

export function DecodeToString(permissions?: any[]): Permission[] {
    var p = [];
    if (!permissions)
        return p;
    for (var i = 0; i < permissions.length; i++) {
        for (var j = 0; j < 32; j++) {
            if ((permissions[i] & (1 << j)) != 0) {
                p.push(Permission[i * 32 + j]);
            }
        }
    }
    return p;
}

export function Check(owned: any[], required: any[]): boolean {
    if (!required) {
        return true; //space saving.
    }
    
    for (var i = 0; i < required.length; i++) {
        if (required[i] == 0)
            continue;
        if (!owned || i >= owned.length)
            return false;
        // OWN 1111
        // REQ 1110
        // (&) 1110 == REQ, good
        // OWN 1011
        // REQ 1110
        // (&) 1010 != REQ, bad
        if ((owned[i] & required[i]) != required[i])
            return false;
    }
    return true;
}

/*
//TESTING CODE//

import readline = require("readline");

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var A = Encode([PermissionType.SYSTEM, PermissionType.IO]);
var B = Encode([PermissionType.SYSTEM, PermissionType.IO, PermissionType.Test1]);

rl.question("Ready To Gen", function (answer) {
    // TODO: Log the answer in a database
    //global.gc();
    console.log(Check(A, B));
    console.log(Check(B, A));
    console.time("Run 10000000");
    for (var i = 0; i < 10000000; i++) {
        Check(A, B);
        Check(B, A);
        //t[i] = ([PermissionType.SYSTEM, PermissionType.IO, PermissionType.Test1]);
    }
    console.timeEnd("Run 10000000");
});
*/

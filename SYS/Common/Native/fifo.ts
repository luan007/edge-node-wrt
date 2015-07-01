//holds all FIFO, releasing them automatically (ideal case)


import fs = require('fs');
import stream = require('stream');
//k-v pairs

import pth = require('path');

var TYPE_SOURCE = 0;
var TYPE_TARGET = 1;

var rawFIFO: IDic<{
    hoststream: any,
    path: string,
    link: string,
    type: number,
    owner: string
}> = {};

function _releaserawfifo(name){
    return ()=>{
        try{
            console.log('Releasing : ', name);
            fs.unlinkSync(rawFIFO[name].path);
            rawFIFO[name].hoststream.removeAllListeners();
            rawFIFO[name] = undefined;

            if(rawFIFO[name].link){
                var link = rawFIFO[name].link;
                console.log('Releasing the other end : ', name);
                fs.unlinkSync(rawFIFO[link].path);
                rawFIFO[link].hoststream.removeAllListeners();
                rawFIFO[link] = undefined;
            }
        } catch(e) {

        }
    };
}

function _mkrawfifo(owner, path, type, cb){
    var name = UUIDstr();
    var p = pth.join(path, name);
    if(!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
        return cb(new Error("FIFO Target Dir is not valid"));
    } else if(fs.existsSync(p)){
        return cb(new Error("FIFO File overlap"));
    } else {
        exec('mkfifo', p, (err, result)=> {
            if (err) {
                return cb(err, undefined);
            }
            //ANYWAY LET'S OPEN THIS CRAP
            try {
                var stream:stream.Stream;
                if (type === TYPE_SOURCE) {
                    //GRANT WRITE ONLY ACCESS!
                    fs.chmodSync(p, '0002');
                    stream = <any>fs.createReadStream(p);
                } else {
                    //GRANT READ ONLY ACCESS!
                    fs.chmodSync(p, '0004');
                    stream = <any>fs.createWriteStream(p);
                }
                rawFIFO[name] = {
                    hoststream: stream,
                    path: p,
                    link: undefined,
                    type: type,
                    owner: owner
                };
                stream.once('end', _releaserawfifo(name));
                return cb(undefined, name);
            } catch(e){
                return cb(e);
            }
        });
    }
}

//Direction is relative to OS

export function WriteOnlyFIFO(owner, path, cb){
    return _mkrawfifo(owner, path, TYPE_SOURCE, cb);
}

export function ReadOnlyFIFO(owner, path, cb){
    return _mkrawfifo(owner, path, TYPE_TARGET, cb);
}

/*YO YO YO YO PIPES PIPES 出了事情赖大哥 */
export function PartyOn(source_id, target_id, cb) {
    if(!rawFIFO[source_id] || !rawFIFO[target_id]){
        return cb(new Error("Oops, Source or Target not found - (Closed by peer?)"));
    }
    if(rawFIFO[source_id].type !== TYPE_SOURCE){
        return cb(new Error("Supplied Source is typed other than TYPE_SOURCE"));
    }
    if(rawFIFO[target_id].type !== TYPE_TARGET){
        return cb(new Error("Supplied Target is typed other than TYPE_TARGET"));
    }
    if(rawFIFO[source_id].link || rawFIFO[target_id].link){
        return cb(new Error("Link is being used, multicast is not supported (yet)"));
    }

    //BOUND!
    rawFIFO[source_id].link = target_id;
    rawFIFO[target_id].link = source_id;

    rawFIFO[source_id].hoststream.pipe(rawFIFO[target_id].hoststream);

    return cb(null);
}

export var FIFOs = rawFIFO;
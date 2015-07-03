//holds all FIFO, releasing them automatically (ideal case)


import fs = require('fs');
import stream = require('stream');
//k-v pairs

import pth = require('path');

var fifos = {};

var ready = {};

function _release(name, called_by?){
    if(fifos[name]){
        try{ <any>(fifos[name].stream).close(); } catch(e) { }
        try{ <any>(fifos[name].stream).destroy(); } catch(e) { }
        try{ <any>(fifos[name].stream).removeAllListeners(); } catch(e) { }
        try{ fs.unlinkSync(fifos[name].fullpath); } catch(e) { }
        if(fifos[name].otherend && fifos[name].otherend !== called_by){
            _release(fifos[name].otherend, name);
        }
        delete fifos[name];
    }
}

function _create_fifo(path, write_to, cb) {
    var name = UUIDstr();
    var p = pth.join(path, name);
    if(!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
        return cb(new Error("FIFO Target Dir is not valid"));
    } else if(fs.existsSync(p)) {
        return cb(new Error("FIFO File overlap"));
    }
    exec('mkfifo', p, (err, result)=> {
        if (err) {
            return cb(err, undefined);
        }
        var stream;
        if (write_to) {
            //GRANT WRITE ONLY ACCESS!
            fs.chmodSync(p, '0002');
            stream = fs.createReadStream(p);
            stream.on('error', (err)=>{
                error(err);
                _release(name);
            }).on('end', ()=>{
                _release(name);
            });
        } else {
            //GRANT READ ONLY ACCESS!
            fs.chmodSync(p, '0004');
            stream = fs.createWriteStream(p);
            stream.on('error', (err)=>{
                error(err);
                _release(name);
            }).on('finish', ()=>{
                _release(name);
            });
        }
        return cb(undefined, p, name, stream);
    });
}

function _notify_when_ok(source, cb){
    if(!(fifos[source] && fifos[source].isSource && !fifos[source].otherend)) {
        return cb(new Error(source + " is not a valid source"));
    }
    if(fifos[source].ready){
        return cb(); //immediate
    } else {
        var newcb = function(){
            cb.apply(null, arguments);
        };
        newcb = must(newcb, 20000);
        ready[source] = newcb;
    }

}

function _fifo_ok(name){
    if(fifos[name] && fifos[name].stream && fifos[name].isSource){
        fifos[name].ready = true;
        //emit event if needed

        if(ready[name]){
            ready[name]();
            delete ready[name];
        }
    }
}

function WriteOnlyFIFO(owner, path, cb){
    _create_fifo(path, true, (err, path, name, stream) => {
        if(err) return cb(err);
        fifos[name] = {
            owner: owner,
            stream: stream,
            fullpath: path,
            ready: false,
            otherend: undefined,
            isSource: true
        };
        stream.once("readable", _fifo_ok(name));
        cb(undefined, name);
    });
}

function ReadOnlyFIFO(owner, path, source, cb) {
    if(!(fifos[source] && fifos[source].isSource && !fifos[source].otherend)) {
        return cb(new Error("Source is not valid"));
    }
    _create_fifo(path, false, (err, path, name, stream) => {
        if(err) return cb(err);
        fifos[name] = {
            owner: owner,
            stream: stream,
            fullpath: path,
            ready: false,
            otherend: undefined,
            isSource: false
        };
        _notify_when_ok(source, (err)=>{
            if(err){
                _release(name);
                return cb(err);
            } else {
                fifos[name].ready = true;
                fifos[name].otherend = source;
                fifos[source].otherend = name;
                (<any>fifos[source].stream).pipe(fifos[name].stream);
                console.log("Piping Begins...", source, " >>> ", name);
                cb(undefined, name);
            }
        });
    });
}

global.FIFO = {};

global.FIFO.Release = function(name) {
    _release(name);
};

global.FIFO.CreateSource = WriteOnlyFIFO;
global.FIFO.CreatePipedTarget = ReadOnlyFIFO;

global.FIFO.ReleaseByOwner = function(owner){
    for(var i in fifos){
        if(fifos[i].owner === owner) {
            _release(i);
        }
    }
};

global.FIFO.DeploySource = WriteOnlyFIFO;

global.FIFO.DeployTarget = ReadOnlyFIFO;

global.FIFO.all = fifos;

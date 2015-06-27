//https://github.com/tzwenn/PyOpenAirMirror
//https://github.com/espes/Slave-in-the-Magic-Mirror
//https://github.com/tzwenn/shairdrop




/** Airplay with Image / Video Support **/
//RANDOM CRAP, need test

import events = require("events");
import express = require("express");
import fs = require("fs");
import path = require("path");
var mdns = require('mdns');


var allocatedports = {};
var allocatedmacs = {};

function allocatePort(class_reference) {
    var maxCount = CONF.PORTS.AIRPLAY_RANGE_MAX - CONF.PORTS.AIRPLAY_RANGE_MIN;
    if(Object.keys(allocatedports).length >= maxCount){
        return -1;
    } else {
        var randomPort = CONF.PORTS.AIRPLAY_RANGE_MIN +
            Math.floor(Math.random() * maxCount);
        if(allocatedports[randomPort]){
            return allocatePort(class_reference);
        } else {
            allocatedports[randomPort] = class_reference;
            return randomPort;
        }
    }
}

function allocateMac(class_reference) {
    var mac = random_mac();
    if(allocatedmacs[mac]){
        return allocateMac(class_reference);
    } else {
        allocatedmacs[mac] = class_reference;
        return mac;
    }
}

function releaseMac(mac){
    delete allocatedmacs[mac];
}

function releasePort(port){
    delete allocatedports[port];
}


//Modify all these...

//SHOULD NOT NEED A CLASS







//with cache maybe?

//multiple server support within a same machine
var SERVERINFO_PART1 = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"> <dict> <key>deviceid</key> <string>';
var SERVERINFO_PART2 = '</string> <key>features</key> <integer>14839</integer> <key>model</key> <string>AppleTV2,1</string> <key>protovers</key> <string>1.0</string> <key>srcvers</key> <string>130.14</string> </dict></plist>';



var STATE_IMG = 1;
var STATE_VID_LOAD = 2;
var STATE_STOPPED = 0;

export class AirPlay_BaseServer {

    private _history_len = 50;
    private _app;
    private _mac;
    private _port;
    private _mdns = [];
    public Queue = [];

    private _name = "Edge";

    public State() {
        return this.Queue[0] ? this.Queue[0].State : STATE_STOPPED;
    }

    public Session() {
        return this.Queue[0] ? this.Queue[0].Session : STATE_STOPPED;
    }

    constructor(name?){
        if(name) this._name = name;
        this._app = express();
        this._mac = allocateMac(this);
        this.reghooks();
    }

    private stateMachine(kind, path, sessionkey, ip){
        this.Queue.unshift({
            State: kind,
            Path: path,
            Ip: ip,
            Session: sessionkey,
            Time: Date.now()
        });
        if(this.Queue.length > this._history_len) {
            this.Queue.pop();
        }
    }

    private reghooks(){

        this._app.get('/server-info', (req, res)=>{
            res.contentType("text/x-apple-plist+xml");
            res.send(200, SERVERINFO_PART1 + this._mac + SERVERINFO_PART2);
        });

        //TODO: need to identify photo & video cover
        this._app.put('/photo', (req, res)=>{
            var action = req.header('X-Apple-AssetAction');
            var key = req.header('X-Apple-AssetKey');
            var session = req.header('X-Apple-Session-ID');
            var ip = req.connection.remoteAddress;
            if(action === 'displayCached'){
                this.stateMachine(STATE_IMG, key, session, ip);
            } else {
                var stream = fs.createWriteStream(CONF.AIRSERVICES_DIR, key + ".jpg");
                req.pipe(stream);
            }
            req.on('end', function(){
                if(action === 'cacheOnly'){
                    return;
                } else {
                    this.stateMachine(STATE_IMG, key, session, ip);
                }
            });
            res.send(200);
        });

        this._app.post('/stop', (req, res)=>{
            var addr = req.connection.remoteAddress;
            var session = req.header('X-Apple-Session-ID');
            this.stateMachine(STATE_STOPPED, undefined, session, addr);
            res.send(200);
        });

        this._app.post('/play', (req, res)=>{
            var addr = req.connection.remoteAddress;
            var session = req.header('X-Apple-Session-ID');
            var contentlocation = req.header('Content-Location');
            if(!contentlocation){
                //emm you are not iTunes but iPhone :p
                var dt = "";
                req.on('data', function(d){
                    dt += d.toString();
                }).on('end', function(){
                    //todo: fix f@cked up binary plist parser
                    //todo: [npm install bplist] please
                    var i = dt.indexOf("http");
                    var j = dt.lastIndexOf("MOV");
                    var str = dt.substring(i, j) + "MOV"; //<--don't screw up with mov, it IS CAPITALIZED
                    this.stateMachine(STATE_VID_LOAD, dt, session, addr);
                });
            } else {
                this.stateMachine(STATE_VID_LOAD, contentlocation, session, addr);
            }
            res.send(200);
        });

    }

    public SetName(name?){

        if(!name) name = this._name;
        while(this._mdns.length){
            var old = this._mdns.pop();
            old.stop();
        }

        var model = 'AppleTV2,1';
        var txt = {
            deviceid: this._mac.toUpperCase(), // MAC address
            features: 0x39f7,       // supported features
            model: model,                // device model
            srcvers: '130.14',        // server version
        };

        this._mdns.push(mdns
            .createAdvertisement(mdns.tcp('airplay'), this._port, {
                name: name,
                txtRecord: txt
            }));

        var txtRecord = {
            txtvers: '1',    // TXT record version 1
            ch: '2',         // audio channels: stereo
            cn: '0,1,2,3',   // audio codecs
            et: '0,3,5',     // supported encryption types
            md: '0,1,2',     // supported metadata types
            pw: 'false',     // does the speaker require a password?
            sr: '44100',     // audio sample rate: 44100 Hz
            ss: '16',        // audio sample size: 16-bit
            tp: 'UDP',       // supported transport: TCP or UDP
            vs: '130.14', // server version
            am: model        // device model
        };

        this._mdns.push(mdns
            .createAdvertisement(mdns.tcp('raop'), this._port, {
                name: this._mac.toUpperCase().replace(/:/g, '') + '@' + name,
                txtRecord: txtRecord
            }));

        for(var i = 0; i < this._mdns.length; i++){
            this._mdns[i].start();
        }
    }

    public GetName(){
        return this._name;
    }

    public start(name?) {
        this._port = allocatePort(this);
        if(this._port === -1){
            //failed :(
            releaseMac(this._mac);
            return false;
        }
        else{
            this._app.listen(this._port);
            this.SetName(name);
            return true;
        }
    }

    public stop(){
        while(this._mdns.length){
            var old = this._mdns.pop();
            old.stop();
        }
        releaseMac(this._mac);
        releasePort(this._port);
        this._app.close();
    }
}

export class Airplay_MultiServer {

}

/** Airtunes goes here **/
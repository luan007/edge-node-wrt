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

//internal method
function allocatePort(mac) {
    var maxCount = CONF.PORTS.AIRPLAY_RANGE_MAX - CONF.PORTS.AIRPLAY_RANGE_MIN;
    if(Object.keys(allocatedports).length >= maxCount){
        return -1;
    } else {
        var randomPort = CONF.PORTS.AIRPLAY_RANGE_MIN +
            Math.floor(Math.random() * maxCount);
        if(allocatedports[randomPort]){
            return allocatePort(mac);
        } else {
            allocatedports[randomPort] = mac;
            return randomPort;
        }
    }
}

//returns -1 if failed
function allocate() {
    var mac = random_mac();
    if(allocatedmacs[mac]){
        return allocate();
    } else {
        allocatedmacs[mac] = allocatePort(mac);
        if(allocatedmacs[mac] === -1)
        {
            release(mac);
            return -1;
        }
        return mac;
    }
}

function release(mac){
    delete allocatedports[allocatedmacs[mac]];
    delete allocatedmacs[mac];
}

//with cache maybe?

//multiple server support within a same machine
var SERVERINFO_PART1 = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"> <dict> <key>deviceid</key> <string>';
var SERVERINFO_PART2 = '</string> <key>features</key> <integer>14839</integer> <key>model</key> <string>AppleTV2,1</string> <key>protovers</key> <string>1.0</string> <key>srcvers</key> <string>130.14</string> </dict></plist>';

var STATE_SERVER_DOWN = -1;
var STATE_IMG = 1;
var STATE_VID_LOAD = 2;
var STATE_STOPPED = 0;

export class AirPlay_BaseServer extends events.EventEmitter {

    private _history_len = 50;
    private _app;
    private _mdns = [];
    public Queue = [];

    private _name = "Edge";

    private running = false;

    public GetMAC(){
        return this._mac;
    }

    public GetPort(){
        return this._port;
    }

    public State() {
        return this.Queue[0] ? this.Queue[0].State : STATE_STOPPED;
    }

    public Session() {
        return this.Queue[0] ? this.Queue[0].Session : STATE_STOPPED;
    }

    constructor(private _mac, private _port, name?){
        super();

        if(name) this._name = name;
        this._app = express();
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
        this.emit("state", this.Queue[0]);
    }

    private reghooks(){
        var self = this;

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
                self.stateMachine(STATE_IMG, key, session, ip);
            } else {
                var stream = fs.createWriteStream(path.join(CONF.AIRSERVICES_DIR, key + ".jpg"));
                req.pipe(stream);
            }
            req.on('end', function(){
                if(action === 'cacheOnly'){
                    return;
                } else {
                    self.stateMachine(STATE_IMG, key, session, ip);
                }
            });
            res.send(200);
        });

        this._app.post('/stop', (req, res)=>{
            var addr = req.connection.remoteAddress;
            var session = req.header('X-Apple-Session-ID');
            self.stateMachine(STATE_STOPPED, undefined, session, addr);
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
                    self.stateMachine(STATE_VID_LOAD, dt, session, addr);
                });
            } else {
                self.stateMachine(STATE_VID_LOAD, contentlocation, session, addr);
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
        if(this.running) return;
        this.running = true;
        this.SetName(name);
        this._app.listen(this._port);
        this.stateMachine(STATE_STOPPED, undefined, undefined, undefined);
    }

    public stop(){
        if(this.running) return;
        while(this._mdns.length){
            var old = this._mdns.pop();
            old.stop();
        }
        this._app.close();
        this.running = false;
        this.stateMachine(STATE_SERVER_DOWN, undefined, undefined, undefined);
    }

}
//name:server

var airservers : IDic<AirPlay_BaseServer> = {};


export var Events = new events.EventEmitter();

// 0  name error
//-1  mac error
export function Add(name, type) : number | AirPlay_BaseServer {
    if(airservers[name]) {
        Events.emit("err_name", name);
        return 0;
    }
    var mac = allocate();
    if(mac === -1){
        Events.emit("err_resource", name);
        return -1;
    }
    var server = new AirPlay_BaseServer(mac, allocatedmacs[mac], name);
    airservers[name] = server;

    server.on("state", (state)=>{
        Events.emit("state", name, state);
    });

    Events.emit("add", name);
    server.start(); //kick it!
    return server;
}

export function Remove(name) {
    //you sure?
    if(airservers[name]){
        Stop(name);
        release(airservers[name].GetMAC());
        airservers[name].removeAllListeners();
        delete airservers[name];
        Events.emit("del", name);
    }
}

export function Start(name){
    if(airservers[name]){
        airservers[name].start();
        Events.emit("start", name);
    }
}

export function Stop(name){
    if(airservers[name]){
        airservers[name].stop();
        Events.emit("stop", name);
    }
}

export function List() : IDic<AirPlay_BaseServer> {
    return airservers;
}

export function Get(name): AirPlay_BaseServer{
    return airservers[name];
}




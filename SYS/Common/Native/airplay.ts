//https://github.com/tzwenn/PyOpenAirMirror
//https://github.com/espes/Slave-in-the-Magic-Mirror
//https://github.com/tzwenn/shairdrop



/** Airplay with Image / Video Support **/
//RANDOM CRAP, need test

//TODO: Refactor Airbase Servers!

import events = require("events");
import express = require("express");
import fs = require("fs");
import path = require("path");
import net = require('net');
var mdns = require('mdns');


var allocatedports = {};
var allocatedmacs = {};

//internal method
function allocatePort(mac) {
    var maxCount = CONF.PORTS.AIRPLAY_RANGE_MAX - CONF.PORTS.AIRPLAY_RANGE_MIN;
    if (Object.keys(allocatedports).length >= maxCount) {
        return -1;
    } else {
        var randomPort = CONF.PORTS.AIRPLAY_RANGE_MIN +
            Math.floor(Math.random() * maxCount);
        if (allocatedports[randomPort]) {
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
    if (allocatedmacs[mac]) {
        return allocate();
    } else {
        allocatedmacs[mac] = allocatePort(mac);
        if (allocatedmacs[mac] === -1) {
            release(mac);
            return -1;
        }
        return mac;
    }
}

function release(mac) {
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
var STATE_CLIENT = 3;
var STATE_CLIENT_UPDATE = 4;
var STATE_UPDATE = 5;

export class AirPlay_BaseServer extends events.EventEmitter {

    private _history_len = 20;
    private _app;
    private _mdns = [];
    public Queue = [];

    private _name = "Edge";

    private running = false;

    public GetMAC() {
        return this._mac;
    }

    public GetPort() {
        return this._port;
    }

    public State() {
        return this.Queue[0] ? this.Queue[0].State : STATE_STOPPED;
    }

    public Session() {
        return this.Queue[0] ? this.Queue[0].Session : STATE_STOPPED;
    }

    constructor(private _mac, private _port, public _ip, name?) {
        super();
        if (name) this._name = name;
    }

    private stateMachine(kind, path, sessionkey, ip) {
        this.Queue.unshift({
            State: kind,
            Path: path,
            Ip: ip,
            Session: sessionkey,
            Time: Date.now()
        });
        if (this.Queue.length > this._history_len) {
            this.Queue.pop();
        }
        this.emit("state", this.Queue[0]);
    }

    private reghooks() {
        var self = this;

        this._app.get('/server-info', (req, res) => {
            res.contentType("text/x-apple-plist+xml");
            res.send(200, SERVERINFO_PART1 + this._mac + SERVERINFO_PART2);
        });

        //TODO: need to identify photo & video cover
        this._app.put('/photo', (req, res) => {
            var action = req.header('X-Apple-AssetAction');
            var key = req.header('X-Apple-AssetKey');
            var session = req.header('X-Apple-Session-ID');
            var ip = req.connection.remoteAddress;
            if (action === 'displayCached') {
                self.stateMachine(STATE_IMG, key, session, ip);
            } else {
                var stream = fs.createWriteStream(path.join(CONF.AIRPLAY_STORE_DIR, key + ".jpg"));
                req.pipe(stream);
            }
            req.on('end', function() {
                if (action === 'cacheOnly') {
                    return;
                } else {
                    self.stateMachine(STATE_IMG, key, session, ip);
                }
            });
            res.send(200);
        });

        this._app.post('/stop', (req, res) => {
            var addr = req.connection.remoteAddress;
            var session = req.header('X-Apple-Session-ID');
            self.stateMachine(STATE_STOPPED, undefined, session, addr);
            res.send(200);
        });

        this._app.post('/play', (req, res) => {
            var addr = req.connection.remoteAddress;
            var session = req.header('X-Apple-Session-ID');
            var contentlocation = req.header('Content-Location');
            if (!contentlocation) {
                //emm you are not iTunes but iPhone :p
                var dt = "";
                req.on('data', function(d) {
                    dt += d.toString();
                }).on('end', function() {
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

    public SetName(name?) {

        if (!name) name = this._name;
        while (this._mdns.length) {
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

        for (var i = 0; i < this._mdns.length; i++) {
            this._mdns[i].start();
        }
    }

    public GetName() {
        return this._name;
    }

    public start(name?) {
        if (this.running) return;
        this.running = true;
        this._app = express();
        this.reghooks();
        this.SetName(name);
        this._app.listen(this._port);
        this.stateMachine(STATE_STOPPED, undefined, undefined, undefined);
    }

    public stop() {
        if (this.running) return;
        while (this._mdns.length) {
            var old = this._mdns.pop();
            old.stop();
        }
        this._app.close();
        this.running = false;
        this.stateMachine(STATE_SERVER_DOWN, undefined, undefined, undefined);
    }

}
//name:server
var airservers = {};

export var Events = new events.EventEmitter();

// 0  name error
//-1  mac error
export function Add(name, ip, type) {
    if (airservers[name]) {
        Events.emit("err_name", name);
        return 0;
    }
    var mac = allocate();
    if (mac === -1) {
        Events.emit("err_resource", name);
        return -1;
    }
    var server;
    if (type === 'IMG') {
        server = new AirPlay_BaseServer(mac, allocatedmacs[mac], ip, name);
        airservers[name] = server;
    } else if (type === 'AUD') {
        server = new AirPlay_AudioServer(mac, allocatedmacs[mac], ip, name);
        airservers[name] = server;
    }
    server.on("state", (state) => {
        Events.emit("state", name, state);
    });

    Events.emit("add", name);
    server.start(); //kick it!
    return server;
}

export function Remove(name) {
    //you sure?
    if (airservers[name]) {
        Stop(name);
        release(airservers[name].GetMAC());
        airservers[name].removeAllListeners();
        delete airservers[name];
        Events.emit("del", name);
    }
}

export function Start(name) {
    if (airservers[name]) {
        airservers[name].start();
        Events.emit("start", name);
    }
}

export function Stop(name) {
    if (airservers[name]) {
        airservers[name].stop();
        Events.emit("stop", name);
    }
}

export function List() {
    return airservers;
}

export function Get(name) {
    return airservers[name];
}

export function SetIP(newip) {
    for (var i in airservers) {
        airservers[i]._ip = newip;
        airservers[i].stop();
        airservers[i].start();
    }
}


var airtunes = require('nodetunes'); //please, make sure you use https://github.com/Emerge/nodetunes.git
//which is patched with ip & port support :p


export class AirPlay_AudioServer extends events.EventEmitter {

    private _history_len = 20;
    private _mdns = [];
    public Queue = [];

    private _server;
    private _clientip;
    private _stream;

    private _meta;
    private _volume;
    private _progress;
    private _artwork;
    private _clientName;
    private _name = "Edge";

    private _clientarr: net.Socket[] = [];

    private _bcast_Server: net.Server;
    public StreamUID;

    public CurrentSong;

    private running = false;

    public GetMAC() {
        return this._mac;
    }

    public GetPort() {
        return this._port;
    }

    public State() {
        return this.Queue[0] ? this.Queue[0].State : STATE_STOPPED;
    }

    constructor(private _mac, private _port, public _ip, name?) {
        super();
        if (name) this._name = name;
    }

    private stateMachine(kind) {
        this.Queue.unshift({
            State: kind,
            Ip: this._clientip,
            ClientName: this._clientName,
            MetaData: this._meta,
            Volume: this._volume,
            Progress: this._progress,
            Artwork: this._artwork,
            StreamUID: this.StreamUID,
            Time: Date.now()
        });
        if (this.Queue.length > this._history_len) {
            this.Queue.pop();
        }
        this.emit("state", this.Queue[0]);
    }

    public GetName() {
        return this._name;
    }

    private _burst(data) {
        for (var i = 0; i < this._clientarr.length; i++) {
            if (!this._clientarr[i]["q"]) {
                try{
                    var stuck = !this._clientarr[i].write(data);
                } catch(e){
                    continue;
                }
                if (stuck) {
                    this._clientarr[i]["q"] = stuck;
                    ((i) => {
                        this._clientarr[i].once("drain", () => {
                            if (this._clientarr[i]) {
                                this._clientarr[i]["q"] = false;
                            }
                        });
                    })(i);
                }
            }
        }
    }

    private _setupStream() {
        this.StreamUID = UUIDstr();
        this._bcast_Server = net.createServer((sock) => {
            var index = this._clientarr.push(sock);
            sock.on("error", () => {
                sock.destroy();
                sock.removeAllListeners();
                this._clientarr[index] = undefined;
            });

            sock.on("data", (d) => {
                //DO NOTHING
            });

            sock.on("end", () => {
                var t = setTimeout(()=>{
                    clearTimeout(t);
                    sock.removeAllListeners();
                }, 2000)
                this._clientarr[index] = undefined;
            });

            sock.on("close", () => {
                sock.removeAllListeners();
                this._clientarr[index] = undefined;
            });
        });
        this._bcast_Server.listen(path.join(CONF.AIRPLAY_STORE_DIR, this.StreamUID));
        this._bcast_Server.on('error', error);
    }

    private _destroyStream() {
        if (this._bcast_Server) {
            if (this._clientarr) {
                while (this._clientarr.length) {
                    var p = this._clientarr.pop();
                    if (!p) continue;
                    p.end();
                    p.removeAllListeners();
                }
            }
            this._bcast_Server.removeAllListeners();
            this._bcast_Server.close();
            this._bcast_Server = undefined;
        }
        try { fs.unlinkSync(path.join(CONF.AIRPLAY_STORE_DIR, this.StreamUID)); } catch (e) { }
        this._stream = this.StreamUID = undefined;
    }


    public start(name?) {
        if (this.running) return;
        this.running = true;
        this._server = new airtunes({
            serverName: name ? name : this._name,
            macAddress: this._mac,
            ipAddress: this._ip,
            port: this._port,
        });
        this._server.on('clientSocket', (ip) => {
            this._clientip = ip;
            this.stateMachine(STATE_CLIENT);
        });
        this._server.on('clientConnected', (stream) => {
            this._stream = stream;
            this._setupStream();
            this.stateMachine(STATE_CLIENT_UPDATE);
            this._stream.on('data', (d) => {
                //this ensures no data leak'z present! :P
                this._burst(d);
                //this.emit("data", d);
            });
        });
        this._server.on('clientNameChange', (name) => {
            this._clientName = name;
            this.stateMachine(STATE_CLIENT_UPDATE);
        });
        this._server.on('metadataChange', (meta) => {
            this._meta = meta;
            this.stateMachine(STATE_UPDATE);
        });
        this._server.on('volumeChange', (v) => {
            this._volume = v;
            this.stateMachine(STATE_UPDATE);
        });
        this._server.on('progressChange', (p) => {
            this._progress = p;
            this.stateMachine(STATE_UPDATE);
        });
        this._server.on('artworkChange', (content) => {
            this._artwork = content;
            this.stateMachine(STATE_UPDATE);
        });

        this._server.on('clientDisconnected', () => {
            this._destroyStream();
            this._clientip = undefined;
            this._clientName = undefined;
            this._stream = undefined;
            this._meta = undefined;
            this._progress = undefined;
            this._volume = undefined;
            this.stateMachine(STATE_STOPPED);
        });
        this._server.start();
        this.stateMachine(STATE_STOPPED);
    }

    public stop() {
        if (this.running) return;
        this._server.stop();
        this._server.removeAllListeners();
        this._destroyStream();
        this.running = false;
        this._clientip = undefined;
        this._clientName = undefined;
        this._stream = undefined;
        this._meta = undefined;
        this._progress = undefined;
        this._volume = undefined;
        this.stateMachine(STATE_SERVER_DOWN);
    }

}
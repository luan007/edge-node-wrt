﻿var ssdp = require('node-ssdp');
var Server = ssdp.Server;
import express = require("express");
/*
    DIRTY HACK AHEAD
*/
//Patch Node-SSDP.. prototype injection

var Client = ssdp.Client;
var __p = Client.prototype._notify;
//inflate "m" event - (alive/byebye/update, msg, {address, family, port, size})
Client.prototype._notify = function () {
    __p.apply(this, arguments);
    arguments[0].NTS && this.emit('m',
        arguments[1],
        200,
        arguments[3],
        arguments[0].NTS.toLowerCase().split(':')[1]
    );
};

import events = require("events");

class _ssdp_Browser extends events.EventEmitter {

    private client;

    private watch_addr = {};
    
    public Watch(address, event_add: (usn, service, rinfo?) => any, event_lost: (usn, service, rinfo?) => any) {
        this.watch_addr[address] = [event_add, event_lost];
    }

    public Unwatch(address) {
        delete this.watch_addr[address];
    }

    private detected = (headers, statusCode, rinfo, kind = 'alive') => {
        if (!(headers && rinfo && kind && rinfo.address && headers.USN)) return;
        switch (kind) {
            case "alive":
                this.emit("serviceUp", rinfo.address, headers);
                if (this.watch_addr[rinfo.address]) {
                    this.watch_addr[rinfo.address][0](headers.USN, headers, rinfo);
                }
                break;
            case "byebye":
                this.emit("serviceDown", rinfo.address, headers);
                if (this.watch_addr[rinfo.address]) {
                    this.watch_addr[rinfo.address][1](headers.USN, headers, rinfo);
                }
                break;
            case "update":

                this.emit("serviceUp", rinfo.address, headers);
            case "notify":
                break;

            default:
                break;
        }
    };

    constructor() {
        super();
        info("Initializing SSDP Browser");
        this.client = new Client();
        this.Start();
    }

    public Start = () => {
        info("Starting SSDP Browser");
        this.client.on("m", this.detected);
        this.client.on("response", this.detected);
        this.client.search('ssdp:all');
    };

    public Stop = () => {
        this.client.removeAllListeners();
    };

}

interface SimpleUPNPRecord {
    versionMajor?: string;
    versionMinor?: string;
    deviceType?: string;
    friendlyName?: string;
    manufacturer?: string;
    manufacturerUrl?: string;
    modelUrl?: string;
    modelName?: string;
    modelNumber?: string;
    serialNumber?: string;
    presentationUrl?: string;
    desc?: string;
}

var defaults: SimpleUPNPRecord = {
    desc: "",
    modelName: MACHINE.ModelName,
    versionMajor: MACHINE.Major,
    versionMinor: MACHINE.Minor,
    friendlyName: MACHINE.ModelName,
    manufacturer: "EmergeLabs",
    manufacturerUrl: "http://emerge.cc",
    serialNumber: MACHINE.Serial,
    deviceType: "urn:schemas-upnp-org:device:InternetGatewayDevice:1",
    modelNumber: MACHINE.ModelNumber,
    modelUrl: MACHINE.ModelUrl,
    presentationUrl: MACHINE.DefaultUrl
};

var upnp_template = '<?xml version="1.0" encoding="UTF-8"?>\n' + 
'<root xmlns="urn:schemas-upnp-org:device-1-0"><specVersion><major>__{{versionMajor}}__</major><minor>__{{versionMinor}}__</minor></specVersion><device><deviceType>__{{deviceType}}__</deviceType><friendlyName>edge</friendlyName><manufacturer>__{{manufacturer}}__</manufacturer><manufacturerURL>__{{manufacturerUrl}}__</manufacturerURL><modelDescription>__{{desc}}__</modelDescription><modelName>__{{modelName}}__</modelName><modelNumber>__{{modelNumber}}__</modelNumber><modelURL>__{{modelUrl}}__</modelURL><serialNumber>__{{serialNumber}}__</serialNumber><UDN>uuid:DC30EF3B-37B3-93DF-A20A-BF3ACE286300</UDN><presentationURL>__{{presentationUrl}}__</presentationURL></device></root>'; //tbd
//var matcher = /__{{(.*?)}}__/;
//__{{versionMajor}}__

function generateUPnPresp(my) {
    var now = upnp_template;
    for (var i in defaults) {
        var c = defaults[i];
        if (my[i] !== undefined) {
            c = my[i];
        }
        now = now.replace("__{{" + i + "}}__", c);
    }
    if (CONF.IS_DEBUG && CONF.SSDP_DEBUG) {
        trace(now);
    }
    return now;
}

var server_prefix = "http://wifi.network:" + CONF.SSDP_PORT + "/"; //TBC
var generic_server = express();

var handled: IDic<SSDP_Server> = {};

generic_server.get("*",(req, res) => {
    if (req.path[req.path.length - 1] == "/") req.path = req.path.substr(0, req.path.length - 1);
    var t = /[^/]+$/.exec(req.path);
    if (CONF.IS_DEBUG && CONF.SSDP_DEBUG) {
        trace(t);
    }
    if (!t) return res.status(404);
    var q = t[0].toLowerCase();
    if (!handled[q] || !handled[q].Record) {
        return res.status(404);
    } else {
        res.contentType("xml");
        return res.send(200, generateUPnPresp(handled[q].Record));
    }
});

export class SSDP_Server {

    public Location;

    public Record: SimpleUPNPRecord;

    private _server = undefined;

    public Opt;

    constructor(record: SimpleUPNPRecord, opts?) {
        var o = opts ? opts : <any>{};
        o.udn = o.udn != undefined ? o.udn : "uuid:" + UUIDstr(false);
        if (!o.location) {
            this.Location = UUIDstr();
            o.location = server_prefix + this.Location;
        }
        this.Opt = o;
    }

    Start = () => {
        if (this._server) {
            this._server.stop();
        }
        this._server = new Server(this.Opt);
        this._server.addUSN("upnp:rootdevice");
        this._server.addUSN(this.Record.deviceType ? this.Record.deviceType : defaults.deviceType);
        if (this.Location) {
            handled[this.Location.toLowerCase()] = this;
        }
        this._server.start();
    };

    Stop = () => {
        if (this._server) {
            this._server.stop();
            this._server = undefined;
        }
        if (this.Location) {
            delete handled[this.Location.toLowerCase()];
        }
    };

}

export var SSDP_Browser = new _ssdp_Browser();

export function Initialize(cb) {
    generic_server.listen(CONF.SSDP_PORT, cb);
    SSDP_Browser.Start();
}
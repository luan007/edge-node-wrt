/*
var mdns = require('mdns');
 
// advertise a http server on port 4321 
var ad = mdns.createAdvertisement(mdns.tcp('device-info'), 0, { txtRecord : {
	model:"AirPort"
} });
ad.start();

var ad2 = mdns.createAdvertisement(mdns.tcp('smb'), 445);
ad2.start();
*/

//TODO: Add MDNS Support (for samba & finder)


//Le List
//http://www.iana.org/form/ports-services
//Javascript alert
var mdns = require('mdns');
var dns = require("dns");
import events = require("events");

class _mdns_Browser extends events.EventEmitter {

    public EVENT_SERVICE_UP = "serviceUp";

    public EVENT_SERVICE_DOWN = "serviceDown";
    
    private browser;

    //ServiceType : Browser
    private manual = {};

    // { Address : { Service : { unique: {/actual/} } } }
    public Alive = {};

    private watch_addr = {};

    public GetServices(address) {
        return this.Alive[address];
    }

    public Watch(address, event_add: (service, my_services?) => any, event_lost: (service, my_services?) => any) {
        this.watch_addr[address] = [event_add, event_lost];
    }

    public Unwatch(address) {
        delete this.watch_addr[address];
    }

    private eventProxy = (event, service) => {
        //trace((event ? "+" : "-") + " " + service.type);
        //trace(service);
        var s = JSON.stringify(service);
        var typeString = mdns.makeServiceType(service.type).toString();

        if (!service.host) {
            return warn("Record is broken, need hostname");
        } 
        dns.lookup(service.host, function(err, ip, family) {
            if (err) return warn(err);
            else {
                info(arguments);
            }

            //if (!ip) return;
            trace((event ? "+" : "-") + " " + service.type + "@" + ip);
            service.addresses = ip;
            var addrs = service.addresses;
            for (var i = 0; i < addrs.length; i++) {
                var addr = addrs[i];
                if (event == 1) { //up
                    if (!this.Alive[addr]) {
                        this.Alive[addr] = {};
                    }
                    if (!this.Alive[addr][typeString]) {
                        this.Alive[addr][typeString] = {};
                    }
                    this.Alive[addr][typeString][s] = service;

                    this.emit(this.EVENT_SERVICE_UP, addr, service);
                    if (this.watch_addr[addr]) {
                        this.watch_addr[addr][0](service, this.Alive[addr]);
                    }
                }
                else if (event == 0) {
                    if (this.Alive[addr] && this.Alive[addr][typeString]) {
                        delete this.Alive[addr][typeString][s];
                        if (Object.keys(this.Alive[addr][typeString]).length == 0) {
                            delete this.Alive[addr][typeString];
                            if (Object.keys(this.Alive[addr]).length == 0) {
                                delete this.Alive[addr];
                            }
                        }
                    }
                    this.emit(this.EVENT_SERVICE_DOWN, addr, service);
                    if (this.watch_addr[addr]) {
                        this.watch_addr[addr][1](service, this.Alive[addr]);
                    }
                }
            }
            //if (event == 1) {
            //    this.emit(this.EVENT_SERVICE_UP, service);
            //}
            //else if (event == 0) {
            //    this.emit(this.EVENT_SERVICE_DOWN, service);
            //}
        });
    };

    private browseService = (service) => {
        var t = service.type;
        if (!t) return;
        var string_ = mdns.makeServiceType(t).toString();
        if (this.manual[string_]) return;
        this.manual[string_] = mdns.createBrowser(t, {
            resolverSequence: [
                mdns.rst.DNSServiceResolve()
            ]
        });
        this.manual[string_].on("serviceUp", this.eventProxy.bind(null, 1));
        this.manual[string_].on("serviceDown", this.eventProxy.bind(null, 0));
        this.manual[string_].on("error",(err) => {
            warn(err);
        });
        this.manual[string_].start();
        trace("STARTING BROWSER - " + string_);
        return this.manual[string_];
    };

    //private dropService = (service) => {
    //    info("SERVICE DOWN");
    //    info(service);
    //    var t = service.type;
    //    if (!t) return;
    //    var string_ = mdns.makeServiceType(t).toString();
    //    if (this.manual[string_]) {
    //        this.manual[string_].stop();
    //        delete this.manual[string_];
    //    }
    //};

    constructor() {
        super();
        //hook all sorts of events
        //because:
        //
        //https://github.com/agnat/node_mdns/issues/91
        info("Initializing MDNS Browser");
        this.browser = mdns.browseThemAll();
        this.browser.on("serviceUp",(service) => {
            this.browseService(service);
        });
        //this.browser.on("serviceDown",(service) => {
        //    this.dropService(service);
        //});
        this.browser.on("error",(err) => {
            //warn(err);
        });
    }

    public Start = () => {
        info("Starting MDNS Browser");
        this.browser.start();
    };

    public Stop = () => {
        this.browser.stop();
    };

}

export var Browser = new _mdns_Browser();

global.mdns = mdns;

export function Initialize(cb) {
    info("Starting..");
    Browser.Start();
    cb();
}
import db = require("./Storage");
import validator = require("validator");
var forsake = require("forsake");

global.throwIf = function (condition:boolean, errormsg?:Error | string | { message: string; code: number }) {
    if (condition) {
        if (!errormsg) throw new Error("Bad Request");
        else if (typeof errormsg === "string") {
            throw new Error(errormsg);
        }
        else {
            throw errormsg;
        }
    }
};

global.requireAuth = function (req) {
    throwIf(!req.ticket, {message: "Requires Authentication", code: ErrorCode.REQUIRE_AUTH});
};

export function Compatibility(req:ExpressServerRequest, res:ExpressServerResponse, next) {
    req.param = function (name:string, default_value = undefined):string {
        if (req.params && req.params[name]) return req.param[name];
        if (req.query && req.query[name]) return req.query[name];
        if (req.body && req.body[name]) return req.body[name];
        return default_value;
    };
    next();
}

export function ErrorHandler(err:Error, req:ExpressServerRequest, res:ExpressServerResponse, next) {
    if (!err) {
        return next();
    }
    res.status(500).json({err: {message: err.message, code: err["code"] ? err["code"] : ErrorCode.GENERAL}});
}

export function Authentication(req:ExpressServerRequest, res:ExpressServerResponse, next) {
    if (req.param("atoken")) {
        db.Models.Ticket.Table.get(req.param("atoken"), (err, ticket) => {
            if (ticket) {
                console.log(ticket.uid);
                console.log(Date.now() + "/" + ticket.expire);
                if (!err && Date.now() < ticket.expire) {
                    req.ticket = ticket;
                    ticket.accessTime = new Date();
                    ticket.save(); // dont wait
                }
            }
            return next();
        });
    }
    else {
        return next();
    }
}


export function Device(req:ExpressServerRequest, res:ExpressServerResponse, next) {
    if (req.param("did")) {
        db.Models.Device.Table.one({
            and: [{router_uid: req.router.uid},
                {local_dev_uid: req.param("did")}]
        }, (err, device) => {
            if (device) {
                req.device = device;
                device.accessTime = new Date();
                device.save(); // dont wait
            }
            return next();
        });
    }
    else {
        return next();
    }
}


export function RequestFidelity(req:ExpressServerRequest, res:ExpressServerResponse, next) {
    throwIf(!req.param("ck"), "Missing Checksum");
    throwIf(!req.param("ts"), "Missing Timestamp");
    throwIf(!validator.isLength(req.param("rid"), 10, 100), "Missing RouterId");
    db.Models.Router.Table.get(req.param("rid"), (err, router) => {
        if (!router) return next(new Error("Router Not Found"));
        req.router = router;
        var privateKey = router.routerkey; //prvKey
        try {
            console.log('private', privateKey)
            var k = sha256_Obj(req.method == "GET" || req.method == "DEL" ? req.query : req.body, {"ck": true});
            var should_match = forsake.decrypt(new Buffer(req.param("ck"), "hex"), privateKey).toString();
            if (k !== should_match) {
                return next(new Error("Bad ``equest"));
            }
        } catch (err) {
            return next(err);
        }
        next();
        router.accessTime = new Date();
        router.save(); //don' t bother
    });
}
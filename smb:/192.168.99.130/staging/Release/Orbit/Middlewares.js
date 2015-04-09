var db = require("./Storage");
var validator = require("validator");
var forsake = require("forsake");
global.throwIf = function (condition, errormsg) {
    if (condition) {
        if (!errormsg)
            throw new Error("Bad Request");
        else if (typeof errormsg === "string") {
            throw new Error(errormsg);
        }
        else {
            throw errormsg;
        }
    }
};
global.requireAuth = function (req) {
    throwIf(!req.ticket, { message: "Requires Authentication", code: 1 /* REQUIRE_AUTH */ });
};
function Compatibility(req, res, next) {
    req.param = function (name, default_value) {
        if (default_value === void 0) { default_value = undefined; }
        if (req.params && req.params[name])
            return req.param[name];
        if (req.query && req.query[name])
            return req.query[name];
        if (req.body && req.body[name])
            return req.body[name];
        return default_value;
    };
    next();
}
exports.Compatibility = Compatibility;
function ErrorHandler(err, req, res, next) {
    if (!err) {
        return next();
    }
    res.status(500).json({ err: { message: err.message, code: err["code"] ? err["code"] : 0 /* GENERAL */ } });
}
exports.ErrorHandler = ErrorHandler;
function Authentication(req, res, next) {
    if (req.param("atoken")) {
        db.Models.Ticket.Table.get(req.param("atoken"), function (err, ticket) {
            if (ticket) {
                console.log(ticket.uid);
                console.log(Date.now() + "/" + ticket.expire);
                if (!err && Date.now() < ticket.expire) {
                    req.ticket = ticket;
                    ticket.accessTime = new Date();
                    ticket.save();
                }
            }
            return next();
        });
    }
    else {
        return next();
    }
}
exports.Authentication = Authentication;
function Device(req, res, next) {
    if (req.param("did")) {
        db.Models.Device.Table.one({
            and: [{ router_uid: req.router.uid }, { local_dev_uid: req.param("did") }]
        }, function (err, device) {
            if (device) {
                req.device = device;
                device.accessTime = new Date();
                device.save();
            }
            return next();
        });
    }
    else {
        return next();
    }
}
exports.Device = Device;
function RequestFidelity(req, res, next) {
    throwIf(!req.param("ck"), "Missing Checksum");
    throwIf(!req.param("ts"), "Missing Timestamp");
    throwIf(!validator.isLength(req.param("rid"), 10, 100), "Missing RouterId");
    db.Models.Router.Table.get(req.param("rid"), function (err, router) {
        if (!router)
            return next(new Error("Router Not Found"));
        req.router = router;
        var privateKey = router.checksumkey;
        var k = sha256_Obj(req.method == "GET" || req.method == "DEL" ? req.query : req.body, { "ck": true });
        var t = new Buffer(req.param("ck"), "hex");
        var should_match = forsake.decrypt(new Buffer(req.param("ck"), "hex"), privateKey).toString();
        if (k !== should_match) {
            return next(new Error("Bad Request"));
        }
        next();
        router.accessTime = new Date();
        router.save();
    });
}
exports.RequestFidelity = RequestFidelity;

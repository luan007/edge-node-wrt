var Storage = require("../Storage");
var validator = require("validator");
function TicketExpiration() {
    return Date.now() + 1000 * 60 * 60 * 24;
}
function FillAuthTicket(ticket, routerid, userid, deviceid, callback) {
    var rtoken = generateToken();
    ticket.uid = generateToken();
    ticket.refreshSalt = generateSalt();
    ticket.owner_uid = userid;
    ticket.router_uid = routerid;
    ticket.expire = TicketExpiration();
    ticket.device_uid = deviceid;
    hash(rtoken, ticket.refreshSalt, function (err, hashedRKey) {
        ticket.refreshToken = hashedRKey;
        callback(err, rtoken);
    });
}
post("/Ticket", function (req, res, next) {
    throwIf(!req.device, { message: "Failed to locate current device", code: 5 /* DEVICE_NOT_FOUND */ });
    throwIf(!(validator.isLength(req.param("id"), 5, 35) && validator.isLength(req.param("pass"), 5, 35) && validator.isLength(req.param("did"), 5, 35)));
    var user = wait.forMethod(Storage.Models.User.Table, "one", {
        or: [{ name: req.param("id") }, { email: req.param("id") }]
    });
    throwIf(!user, "User Not Found");
    var hashed = wait.for(hash, req.param("pass"), user.salt);
    throwIf(user.hashedkey !== hashed, "Unmatched Credential");
    wait.for(Storage.Models.Ticket.Table.find({
        owner_uid: user.uid,
        router_uid: req.router.uid,
        device_uid: req.device.uid
    }).remove);
    var ticket = new Storage.Models.Ticket.Ticket();
    var rtoken = wait.for(FillAuthTicket, ticket, req.router.uid, user.uid, req.device.uid);
    wait.for(Storage.Models.Ticket.Table.create, ticket);
    res.json({
        owner_uid: user.uid,
        accessToken: ticket.uid,
        refreshToken: rtoken,
        expire: ticket.expire - new Date().getTime()
    });
});
put("/Ticket", function (req, res, next) {
    throwIf(!req.device, { message: "Failed to locate current device", code: 5 /* DEVICE_NOT_FOUND */ });
    throwIf(!(req.ticket && validator.isLength(req.param("rtoken"), 1, 100)));
    var ticket = req.ticket;
    var router = req.router;
    var user = ticket.owner;
    var device = req.device;
    var oldrtoken = req.param("rtoken");
    var hashedRKey = wait.for(hash, oldrtoken, ticket.refreshSalt);
    if (hashedRKey !== ticket.refreshToken) {
        throw new Error("Wrong Token");
    }
    var nticket = new Storage.Models.Ticket.Ticket();
    var rtoken = wait.for(FillAuthTicket, nticket, router.uid, user.uid, device.uid);
    ticket.remove(function (err) {
    });
    wait.for(Storage.Models.Ticket.Table.create, nticket);
    res.json({
        owner_uid: user.uid,
        accessToken: nticket.uid,
        refreshToken: rtoken,
        expire: nticket.expire - new Date().getTime()
    });
});


import store = require("../Storage");
import validator = require("validator");

//POST = CREATE NEW USER
post("/User",(req, res) => {
    throwIf(!validator.isLength(req.param("name"), 5, 15), "Invalid Name (Length: 5 ~ 15)");
    throwIf(!validator.isEmail(req.param("email")), "Invalid Email");
    throwIf(!validator.isLength(req.param("password"), 6, 20), "Invalid Password (Length: 6 ~ 20)");
    var count = wait.for(store.Models.User.Table.count, {
        or: [{ name: req.param("name") },
            { email: req.param("email") }]
    });
    throwIf(count != 0, "User Exists");
    var user = new store.Models.User.User();
    user.email = req.param("email");
    user.name = req.param("name");
    user.salt = generateSalt();
    user.uid = UUIDstr();
    var key = wait.for(hash, req.param("password"), user.salt);
    user.hashedkey = key;
    wait.for(store.Models.User.Table.create, user);
    res.json({
        name: user.name,
        data: user.data,
        uid: user.uid
    });
});

put("/User/data",(req, res) => {
    requireAuth(req);
    var ticket: store.Models.Ticket.ITicket = req.ticket;
    var user = ticket.owner;
    user.data = JSON.parse(req.param("data"));
    wait.for(user.save, {});
    res.json({
        data: user.data,
        uid: user.uid
    });
});

////PUT = UPDATE USER's PASSWORD
put("/User",(req, res) => {
    requireAuth(req);
    var ticket: store.Models.Ticket.ITicket = req.ticket;
    var user = ticket.owner;
    throwIf(!validator.isLength(req.param("password"), 6, 20), "Invalid Password (Length: 6 ~ 20)");
    user.salt = generateSalt();
    var key = wait.for(hash, req.param("password"), user.salt);
    user.hashedkey = key;
    wait.for(user.save, {});
    res.json({
        name: user.name,
        uid: user.uid
    });
});



var _get_user = (req, res) => {
    requireAuth(req);
    var ticket: store.Models.Ticket.ITicket = req.ticket;
    var user = ticket.owner;
    if (!req.param("uid") || req.param("uid") == "" || req.param("uid") === "me") {
        var _user = user;
    }
    else {
        throwIf(!validator.isLength(req.param("uid"), 10, 50), "UID Error");
        var _user: store.Models.User.IUser = wait.for(store.Models.User.Table.get, req.param("uid"));
        throwIf(!_user, "User Not Found");
    }
    res.json({
        name: _user.name,
        uid: _user.uid,
        data: _user.data
    });
};

////GET = GET <ANY> USER NAME(?) (FOR NOW)
get("/User/:uid", _get_user);
get("/User", _get_user);

//get("/Test",(req, res, next) => {
//    wait.for(store.User.Table.get, 1);
//});

//DEL = 
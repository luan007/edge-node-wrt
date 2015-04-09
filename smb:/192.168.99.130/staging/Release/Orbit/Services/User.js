var store = require("../Storage");
var validator = require("validator");
post("/User", function (req, res) {
    throwIf(!validator.isLength(req.param("name"), 5, 15), "Invalid Name (Length: 5 ~ 15)");
    throwIf(!validator.isEmail(req.param("email")), "Invalid Email");
    throwIf(!validator.isLength(req.param("password"), 6, 20), "Invalid Password (Length: 6 ~ 20)");
    var count = wait.for(store.Models.User.Table.count, {
        or: [{ name: req.param("name") }, { email: req.param("email") }]
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
put("/User/data", function (req, res) {
    requireAuth(req);
    var ticket = req.ticket;
    var user = ticket.owner;
    user.data = JSON.parse(req.param("data"));
    wait.for(user.save, {});
    res.json({
        data: user.data,
        uid: user.uid
    });
});
put("/User", function (req, res) {
    requireAuth(req);
    var ticket = req.ticket;
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
var _get_user = function (req, res) {
    requireAuth(req);
    var ticket = req.ticket;
    var user = ticket.owner;
    if (!req.param("uid") || req.param("uid") == "" || req.param("uid") === "me") {
        var _user = user;
    }
    else {
        throwIf(!validator.isLength(req.param("uid"), 10, 50), "UID Error");
        var _user = wait.for(store.Models.User.Table.get, req.param("uid"));
        throwIf(!_user, "User Not Found");
    }
    res.json({
        name: _user.name,
        uid: _user.uid,
        data: _user.data
    });
};
get("/User/:uid", _get_user);
get("/User", _get_user);

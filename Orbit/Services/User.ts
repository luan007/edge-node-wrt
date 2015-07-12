import store = require("../Storage");
import validator = require("validator");
import fs = require('fs');
import path = require('path');

//POST = CREATE NEW USER
post("/User", (req, res) => {
    throwIf(!validator.isLength(req.param("name"), 5, 15), "Invalid Name (Length: 5 ~ 15)");
    throwIf(!validator.isEmail(req.param("email")), "Invalid Email");
    throwIf(!validator.isLength(req.param("password"), 6, 20), "Invalid Password (Length: 6 ~ 20)");
    var count = wait.for(store.Models.User.Table.count, {
        or: [{name: req.param("name")},
            {email: req.param("email")}]
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

put("/User/data", (req, res) => {
    requireAuth(req);
    var ticket:store.Models.Ticket.ITicket = req.ticket;
    var user = ticket.owner;
    user.data = JSON.parse(req.param("data"));
    wait.for(user.save, {});
    res.json({
        data: user.data,
        uid: user.uid
    });
});

////PUT = UPDATE USER's PASSWORD
put("/User", (req, res) => {
    requireAuth(req);
    var ticket:store.Models.Ticket.ITicket = req.ticket;
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
    var ticket:store.Models.Ticket.ITicket = req.ticket;
    var user = ticket.owner;
    if (!req.param("uid") || req.param("uid") == "" || req.param("uid") === "me") {
        var _user = user;
    }
    else {
        throwIf(!validator.isLength(req.param("uid"), 10, 50), "UID Error");
        var _user:store.Models.User.IUser = wait.for(store.Models.User.Table.get, req.param("uid"));
        throwIf(!_user, "User Not Found");
    }
    res.json({
        name: _user.name,
        uid: _user.uid,
        data: _user.data,
        version: _user.version,
        avatar: _user.avatar
    });
};

////GET = GET <ANY> USER NAME(?) (FOR NOW)
get("/User/:uid", _get_user);
get("/User", _get_user);

// download avatar
post("/User/avatar/download/:avatarid", (req, res) => {
    requireAuth(req);
    var ticket:store.Models.Ticket.ITicket = req.ticket;
    var user = ticket.owner;
    throwIf(!user.avatar || user.avatar !== req.param('avatarid'), 'avatar version error');
    var avatarFilePath = path.join(ORBIT_CONF.AVATAR_DIR, user.avatar);
    if (!fs.existsSync(avatarFilePath)) {
        throw new Error('avatar read error');
    }
    fs.createReadStream(avatarFilePath).pipe(<any>res);
});

// upload avatar
post("/User/avatar/upload/:avatarid", (req, res)=> {
    requireAuth(req);
    var user:any = {};
    user.user_id = req.param('user_id');
    throwIf(user.user_id !== req.ticket.owner_uid, "User Not Match Request.");

    user.avatar = req.param('avatarid');
    user.version = req.param('version');
    user.avatar_data = req.param('avatar_data');

    store.Models.User.Table.one({uid: user.user_id}, (err, userInDB)=>{
        if(err) return res.status(500).json({});
        if(user.version > userInDB.version && userInDB.avatar !== user.avatar){
            userInDB.avatar = user.avatar;
            userInDB.version = user.version;
            userInDB.save({}, (err)=>{ if(err) return console.log(err); });
            var avatarFilePath = path.join(ORBIT_CONF.AVATAR_DIR, user.avatar);
            fs.writeFile(avatarFilePath, user.avatar_data);
        }
        return res.status(200).json({});
    });
});

post("/User/sync", (req, res)=> {
    requireAuth(req);
    var user:any = {};
    user.uid = req.ticket.owner_uid;
    user.avatar = req.param('avatar');
    user.version = req.param('version');
    user.name = req.param('name');
    user.data = req.param('data');
    user.lastSeen = req.param('lastSeen');

    var userInDB:store.Models.User.IUser = wait.forMethod(store.Models.User.Table, "one", {uid: user.uid});
    throwIf(!userInDB, "User Not Found");

    userInDB = JSON.parse(JSON.stringify(userInDB));
    var avatar_diff = false;

    if (userInDB.version === user.version)
        return res.status(200).json({state: 'OK'});
    if (userInDB.version > user.version) {
        if (user.avatar !== userInDB.avatar) avatar_diff = true;
        return res.status(200).json({state: 'DOWN', avatar_diff: avatar_diff, entity: userInDB});
    } else if (userInDB.version < user.version) {
        if (user.avatar !== userInDB.avatar) avatar_diff = true;
        return res.status(200).json({state: 'UP', avatar_diff: avatar_diff});
    }
});


//get("/Test",(req, res, next) => {
//    wait.for(store.User.Table.get, 1);
//});

//DEL = 
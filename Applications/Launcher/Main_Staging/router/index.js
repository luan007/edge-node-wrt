var route = require("express").Router();
var Cookies = require("cookies");


route.post("/", function (req, res) {
    if (req.query.r &&
        req.query.c &&
        digest(req.query.r, global.AuthServerKey) == req.query.c) {
        
        //Valid Redirection
        return res.redirect(req.query.r);
    }
    else {
        return res.redirect("/");
    }
});

route.get("/", function (req, res) {
    res.render("index");
});


route.get("/Logout", function (req, res) {
    var host = req.header("edge-host").toLowerCase();
    if (host !== global.AUTH_DOMAIN) {
        return res.redirect("http://" + global.AUTH_DOMAIN + "/Logout");
    }
    //remove server-side credential
    //remove R-Token
    var cookies = new Cookies(req, res);
    var atoken = cookies.get("edge_atoken");
    API.Launcher.Logout(atoken, function (err, result) {
        cookies.set("edge_atoken");
        cookies.set("edge_rtoken");
        res.redirect("/");
    });
});
module.exports = route;
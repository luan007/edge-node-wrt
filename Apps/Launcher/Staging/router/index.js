/* global global */
/* global API */
/* global digest */
var route = require("express").Router();
var Cookies = require("cookies");

function SetCookie(cookie, atoken, expire, d) {
    cookie.set("edge_atoken", atoken,
        {
        httpOnly: true,
        overwrite: true,
        domain: d,
        path: "/",
        expires: expire
    });
}

function SetRtoken(cookie, rtoken, expire) {
    cookie.set("edge_rtoken", rtoken, {
        httpOnly: true,
        overwrite: true,
        path: "/renew",
        domain: global.AUTH_DOMAIN,
        expires: expire
    });
}

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
    res.render("index", {css: global.css});
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
        SetCookie(cookies, "", new Date(0), global.AUTH_DOMAIN);
        SetRtoken(cookies, "", new Date(0));
        res.redirect("/");
    });
});
module.exports = route;
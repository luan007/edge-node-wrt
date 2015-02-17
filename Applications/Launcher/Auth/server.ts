import http = require("http");
import express = require("express");
import querystring = require("querystring");
import path = require("path");
var connect = require("connect");
var Cookies = require("cookies");

var key = UUIDstr();
var app = express();

global.AuthServerKey = key;


//app.use(connect.favicon());
app.use(connect.logger("dev"));
app.use(connect.json());
app.use(connect.urlencoded());
app.use(connect.query());
app.use(connect.errorHandler());
app.use("/public", express.static(path.join(__dirname + 'Auth/public')));

//export function ErrorHandler(err: Error, req: ExpressServerRequest, res: ExpressServerResponse, next) {
//    if (!err) { return next(); }
//    res.status(500).json({ err: { message: err.message, code: err["code"] ? err["code"] : ErrorCode.GENERAL } });
//}

var AUTH_DOMAIN = "wifi.network";
global.AUTH_DOMAIN = AUTH_DOMAIN;
var ROUTER_LOCAL = [
    "ed.ge",
    "wi.fi"
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Auth/views'));

function SetCookie(cookie, atoken, expire, domain) {
    cookie.set("edge_atoken", atoken,
        {
            httpOnly: true,
            overwrite: true,
            domain: domain,
            expires: expire
        });
}

function SetRtoken(cookie, rtoken, expire) {
    cookie.set("edge_rtoken", rtoken, {
        httpOnly: true,
        overwrite: true,
        path: "/renew",
        domain: AUTH_DOMAIN,
        expires: expire
    });
}

function LoginSuccess(req, res, expire, cookies, atoken, rtoken) {
    SetRtoken(cookies, rtoken, expire);
    return res.render("Distribute.ejs", {
        originalQuery: querystring.stringify(req.query),
        query: querystring.stringify({
            atoken: atoken
        }),
        domains: ROUTER_LOCAL.concat(AUTH_DOMAIN)
    });
}

app.get("/",(req, res) => {

    var host = req.header("edge_host").toLowerCase();
    if (host !== AUTH_DOMAIN) {
        var target = "http://" + AUTH_DOMAIN + "/?";
        var back = "http://" + req.header("edge_host") + req.originalUrl;
        return res.redirect(target + querystring.stringify(
            {
                r: back,
                c: digest(back, key)
            }));
    }
    console.log(host);
    //Renewal Baseline (at AUTH_DOMAIN [ wifi.network ])
    var cookies = new Cookies(req, res);
    console.log(req.cookies);
    var atoken = cookies.get("edge_atoken");
    if (atoken) {
        //leaving to /renew
        return res.redirect("/renew?" + querystring.stringify(req.query));
    }
    return res.render("Entry.ejs");

    ////console.log(atoken);
    //if (atoken) {
    //    var target = "http://wifi.network/renew?"
    //    return res.redirect(target + querystring.stringify(
    //        {
    //            r: req.originalUrl,
    //            c: digest(req.originalUrl, key)
    //        }));
    //} else {
    //    //console.log(req.header("edge_dev"));
    //    //console.log(req);
    //    console.log("Rendering Test.ejs");
    //    res.render("Test.ejs");
    //}
});

app.post("/auth",(req, res) => {
    var host = req.header("edge_host").toLowerCase();
    if (host !== AUTH_DOMAIN) {
        return res.json({ err: { message: "outside authdomain" } });
    }

    var cookies = new Cookies(req, res);
    var uore = req.body.uore;
    var pass = req.body.pass;
    var r = req.body.r;
    var c = req.body.c;
    var deviceid = req.header("edge_dev");
    API.Launcher.Login(uore, pass, deviceid,(err, result) => {
        if (err) {
            res.json({ err: err, device: deviceid });
        } else {
            var expire = new Date();
            expire.setTime(new Date().getTime() + (60 * 1000 * 60 * 24));
            LoginSuccess(req, res, expire, cookies, result.atoken, result.rtoken);
        }
    });

});

app.get("/renew",(req, res) => {
    res.render("Renew.ejs", {
        query: querystring.stringify(req.query)
    });
});

app.post("/renew",(req, res) => {
    var expire = new Date();
    expire.setTime(new Date().getTime() + (60 * 1000 * 60 * 24));
    var host = req.header("edge_host").toLowerCase();
    if (host !== AUTH_DOMAIN) {
        return res.redirect("http://" + AUTH_DOMAIN + "/?" + querystring.stringify(req.query));
    }
    //var returningUrl = (req.query && req.query.r && digest(req.query.r, key) === req.query.c) ? req.query.r : "/";
    var cookies = new Cookies(req, res);
    var atoken = cookies.get("edge_atoken");
    var rtoken = cookies.get("edge_rtoken");
    var device_id = req.header("edge_dev");
    if (!(atoken && rtoken && device_id)) {
        cookies.set("edge_atoken");
        cookies.set("edge_atoken");
        return res.redirect("http://" + AUTH_DOMAIN + "/?" + querystring.stringify(req.query));
    }
    API.Launcher.Renew(atoken, rtoken, device_id,(err, result) => {
        if (err || !result) {
            console.log("Renew Failed");
            cookies.set("edge_atoken");
            cookies.set("edge_atoken");
            return res.redirect("http://" + AUTH_DOMAIN + "/?" + querystring.stringify(req.query));
        }
        else {
            //All green
            LoginSuccess(req, res, expire, cookies, result.atoken, result.rtoken);
        }
    });
});

app.get("/distribute",(req, res) => {
    var expire = new Date();
    expire.setTime(new Date().getTime() + (60 * 1000 * 60 * 24));
    var host = req.header("edge_host").toLowerCase();
    var domains = ROUTER_LOCAL.concat(AUTH_DOMAIN);
    for (var i in domains) {
        if (domains[i] == host) {
            var cookies = new Cookies(req, res);
            SetCookie(cookies, req.query.atoken, expire, ROUTER_LOCAL[i]);
            return res.status(200).json({});
        }
    }
    return res.status(404).json({});
});

app.get("*",(req, res) => {
    //Catch All Request
    //Redirect :/
    var cookies = new Cookies(req, res);
    var atoken = cookies.get("edge_atoken");
    var target = "http://" + AUTH_DOMAIN + ( /*atoken*/ true ? "/renew?" : "/?");
    var back = "http://" + req.header("edge_host") + req.originalUrl;
    res.redirect(target + querystring.stringify(
        {
            r: back,
            c: digest(back, key)
        }));
});

export function Initialize(port, cb) {
    console.log("Starting Auth Server @" + port);
    app.listen(port, cb);
}

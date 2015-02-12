import http = require("http");
import express = require("express");
import querystring = require("querystring");
import fs = require("fs");
var connect = require("connect");
var Cookies = require("cookies");

var app = express();

//app.use(connect.logger("dev"));
//app.use(connect.json());
//app.use(connect.urlencoded());
//app.use(connect.query());
//app.use(connect.errorHandler());

var key = UUIDstr();
app.set('view engine', 'ejs');
app.set('views', '/Main/');


app.use("/public/css", connect.static('/Main/public/css'));
app.use("/public/js", connect.static('/Main/public/js'));
app.use("/public/images", connect.static('/Main/public/images'));

//app.use(serveStatic('/Main/public/images', { index: false }));

app.post("/",(req, res) => {
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

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/Logout",(req, res) => {
    var host = req.header("edge_host").toLowerCase();
    if (host !== global.AUTH_DOMAIN) {
        return res.redirect("http://" + global.AUTH_DOMAIN + "/Logout");
    }
    //remove server-side credential
    //remove R-Token
    var cookies = new Cookies(req, res);
    var atoken = cookies.get("edge_atoken");
    API.Launcher.Logout(atoken,(err, result) => {
        cookies.set("edge_atoken");
        cookies.set("edge_rtoken");
        res.redirect("/");
    });
});

//app.get("/Test",(req, res) => {
//    var result = "";
//    var err;
//    try {
//        result = fs.readFileSync("/Main/public/js/velocity.js").toString();
//    } catch (e) {
//        err = e;
//        console.log(e);
//    }
//    res.json({ result: result, err: err });
//});

//app.get("/Test",(req, res: any) => {
//    //res.json({ result: fs.statSync("/Main/public/js/velocity.js") });
//    res.sendFile("/Main/public/images/bg.jpg");
//});

export function Initialize(port, cb) {
    console.log("Starting Launcher Server @" + port);
    app.listen(port, cb);
}
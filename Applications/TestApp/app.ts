﻿import http = require("http");
import express = require("express");
import querystring = require("querystring");
import path = require("path");
var logger = require("morgan");
var bodyParser = require('body-parser');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get("/",(req, res) => {
    res.render("index", {
        APIJ: global.API_JSON
    });
});

app.post("/",(req, res) => {
    var a = req.body.args;
    var t = eval("[" + a + "]");
    var f = eval("API" + "." + req.body.func);
    t.push((err, result) => {
        res.render("result", {
            err: require("util").inspect(err, { depth: null }),
            result: require("util").inspect(result, { depth: null })
        });
    });
    f.apply(null, t);
});

Server.on("request", app);
import http = require("http");
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
        API: global.API_JSON
    });
});

app.listen(Server);
var express = require("express");
var path = require("path");
var favicon = require('serve-favicon');
var logger = require("morgan");
var bodyParser = require('body-parser');
var app = express();
var key = UUIDstr();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/", require("./router/index"));
app.use("/landscape", require("./router/landscape"));
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err["status"] = 404;
    next(err);
});
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
app.get("/", function (req, res) {
    res.render("index");
});
function Initialize(port, cb) {
    console.log("Starting Launcher Server @" + port);
    app.listen(port, cb);
}
exports.Initialize = Initialize;

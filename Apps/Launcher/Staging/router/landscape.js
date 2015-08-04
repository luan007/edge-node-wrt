var route = require("express").Router();

route.get("/", function (req, res) {
    res.render("landscape", {css: global.css});
});

module.exports = route;

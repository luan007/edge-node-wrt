var route = require("express").Router();

route.get("/", function (req, res) {
    res.render("index");
});

module.exports = route;
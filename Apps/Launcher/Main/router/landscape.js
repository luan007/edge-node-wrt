﻿var route = require("express").Router();

route.get("/", function (req, res) {
    res.render("landscape");
});

module.exports = route;
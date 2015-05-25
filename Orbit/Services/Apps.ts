import Storage = require("../Storage");
import validator = require("validator");
import Data = require("../Storage");

get("/App/all", (req, res, next) => {
    var page = parseInt(req.param('page'));
    var ps = 10;
    Data.Models.Application.Table.find({}).limit(ps).offset((page - 1) * ps).run((err, applications)=> {
        if (err) return next(err);
        res.json(200, applications);
    });
});

post('/App/purchase', (req, res, next) => {
    var app_uid = req.param('app_uid');
    var router_uid = req.router.router_uid;
    Data.Models.RouterApp.Table.find({app_uid: app_uid, router_uid: router_uid}, (err, routerApp)=> {
        if (err) return next(err);
        if (!routerApp) {
            Data.Models.RouterApp.Table.create({
                router_uid: app_uid,
                app_uid: router_uid,
                orderTime: new Date(),
                installTime: new Date()
            }, (err, items)=> {
                if(err) return next(err);
                return res.json(items);
            });
        } else {
            return res.json('{}');
        }
    });
});
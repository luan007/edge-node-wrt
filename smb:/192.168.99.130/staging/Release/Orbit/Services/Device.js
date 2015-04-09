var Storage = require("../Storage");
var validator = require("validator");
post("/Device", function (req, res, next) {
    throwIf(!(validator.isLength(req.param("did"), 5, 35) && validator.isLength(req.param("busname"), 1, 35) && validator.isLength(req.param("hwaddr"), 1, 35)));
    var dev;
    if (!req.device) {
        var device = new Storage.Models.Device.Device();
        device.uid = generateToken();
        device.local_dev_uid = req.param("did");
        device.router_uid = req.router.uid;
        device.accessTime = new Date();
        device.updateTime = new Date();
        device.busname = req.param("busname");
        device.hwaddr = req.param("hwaddr");
        device.attributes = {};
        dev = wait.for(Storage.Models.Device.Table.create, device);
    }
    else {
        dev = req.device;
        dev.updateTime = new Date();
        dev.busname = req.param("busname") ? req.param("busname") : dev.busname;
        dev.hwaddr = req.param("hwaddr") ? req.param("hwaddr") : dev.hwaddr;
        dev.local_dev_uid = req.param("did") ? req.param("did") : dev.local_dev_uid;
        wait.for(dev.save);
    }
    res.json({
        did: dev.local_dev_uid
    });
});

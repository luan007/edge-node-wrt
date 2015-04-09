global.Drivers = {
    TestDriver: {
        load: function (cb) {
            cb(undefined, true);
        },
        unload: function (cb) {
            cb();
        },
        attach: function (dev, match_result, cb) {
            cb(undefined, {
                aux: "test"
            });
        },
        detach: function (dev, cb) {
            cb();
        },
        match: function (dev, cb) {
            cb(undefined, {
                test: 1
            });
        },
        change: function (cb) {
            cb();
        },
        invoke: function (dev, action, param, cb) {
            cb();
        }
    }
};

global.Drivers = {
    TestDriver: {
        load: (cb) => {
            cb(undefined, true);
        },
        unload: (cb) => {
            cb();
        },
        attach: (dev: IDevice, match_result, cb: PCallback<IDeviceAssumption>) => {
            cb(undefined, {
                aux: "test"
            });
        },
        detach: (dev, cb) => {
            cb();
        },
        match: (dev, cb) => {
            //console.log(dev);
            cb(undefined, {
                test: 1
            });
        },
        change: (cb) => {
            cb();
        },
        invoke: (dev, action, param, cb) => {
            cb();
        }
    }
};

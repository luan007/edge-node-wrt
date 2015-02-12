exports.Load = function (load_arg: string[], callback: Function) {
    require("./HttpProxy").Initialize((err, result) => {
        if (err) {
            error(err);
            throw (err);
        }
        callback();
    });
}

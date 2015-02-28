export function Initialize(args, cb) {
    async.series([
        require("./Network").Initialize,
        require("./Phy/_Module").Initialize,
    ], cb);
}
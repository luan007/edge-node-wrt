export function Initialize(cb) {
    async.series([
        require("./Wifi").Initialize,
    ], cb);   
}
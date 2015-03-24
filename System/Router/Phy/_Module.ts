﻿export function Initialize(cb) {
    async.series([
        require("./Wifi").Initialize,
        require("./Bluetooth").Initialize,
    ], cb);   
}
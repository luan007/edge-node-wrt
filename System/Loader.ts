require("./Env");

var child_process = require("child_process");

process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(err.stack);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    console.log(err);
    console.log(err.stack);
});

domain.run(function () {
    var jobs = [];

    jobs.push(function(cb){//Register ALL

        cb();
    });
    jobs.push(function(cb){
        cb();
    });
    jobs.push(function(cb){
        cb();
    });
    jobs.push(function(cb){
        cb();
    });

    async.series(jobs, function() {
        console.log("ALL LOADED...".green);


    });
});
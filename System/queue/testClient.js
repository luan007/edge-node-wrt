var client = require("./client");
var async = require("async");

var jobs = [];
var messages = [
    "Borussia Dortmund wins German championship",
    "Tornado warning for the Bay Area",
    "More rain for the weekend",
    "Android tablets take over the world",
    "iPad2 sold out",
    "Nation's rappers down to last two samples"
];

function getMessage() {
    return  messages[Math.floor(Math.random() * messages.length)];
}

jobs.push(function(cb){
    client.Set("holy", getMessage(), function(data) {
        console.log("RESP: ", data);
        cb();
    });
});
jobs.push(function(cb){
    client.Set("holy", getMessage(), function(data) {
        console.log("RESP: ", data);
        cb();
    });
});

jobs.push(function(cb){
    client.Drain("holy", function(data) {
        console.log("RESP: ", data);
        cb();
    });
});

async.series(jobs, function(){});
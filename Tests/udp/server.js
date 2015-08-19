var dgram = require('dgram');
var server = dgram.createSocket("udp4");
var localhost = "127.0.0.1";
var port = 8088;

var messages = [
    "Borussia Dortmund wins German championship",
    "Tornado warning for the Bay Area",
    "More rain for the weekend",
    "Android tablets take over the world",
    "iPad2 sold out",
    "Nation's rappers down to last two samples"
];

function broadcast() {
    var message = messages[Math.floor(Math.random() * messages.length)];
    var json = new Buffer(JSON.stringify({ message:message, type:"crap"}));
    server.send(json, 0, json.length, port, localhost, function(){
        server.close();
    });
}

//setInterval(broadcast, 2000);
broadcast();
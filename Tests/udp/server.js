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
    var message = new Buffer(messages[Math.floor(Math.random() * messages.length)]);
    server.send(message, 0, message.length, port, localhost);
}

setInterval(broadcast, 2000);
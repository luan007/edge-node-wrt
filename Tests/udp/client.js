var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var localhost = "127.0.0.1";
var port = 8088;

client.on("listening", function(){
    client.setBroadcast(true)
    client.setMulticastTTL(128);
});

client.on("message", function(message, rinfo){
    var json = JSON.parse(message.toString());
    console.log(json.type, json.message, rinfo);
});

client.bind(port, localhost);

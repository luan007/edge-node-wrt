var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var localhost = "127.0.0.1";
var port = 8088;

client.on("listening", function(){
    client.setBroadcast(true)
    client.setMulticastTTL(128);
});

client.on("message", function(message, remote){
    console.log(message.toString(), remote);
});

client.bind(port, localhost);

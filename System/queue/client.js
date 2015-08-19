var net = require("net");
var port = 12345;
var client = new net.Socket();
var sockPath = "/tmp/fdsock/light_queue.sock";

var connectionListener = function () {
    console.log("I'm connected.");

    var json = {};
    json.action = "SET";
    json.name = "holy";
    json.data = {"sex": "female", "age": 20};

    client.write(JSON.stringify(json));
};

client.connect(sockPath, connectionListener);
client.on('data', function (data) {
    console.log('Server Response: ', data.toString());
    client.end();
});
client.on('end', function () {
    console.log("I'm disconnected");
});
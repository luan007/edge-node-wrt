var net = require("net");
var port = 12345;
var sockPath = "/tmp/fdsock/light_queue.sock";

function _set_data(name, data, client) {
    var json = {};
    json.action = "SET";
    json.name = name;
    json.data = data;
    client.write(JSON.stringify(json));
}
function _get_data(name, client) {
    var json = {};
    json.action = "GET";
    json.name = name;
    json.data = {};
    client.write(JSON.stringify(json));
}
function _drain_data(name, client) {
    var json = {};
    json.action = "DRAIN";
    json.name = name;
    json.data = {};
    client.write(JSON.stringify(json));
}

function _new_socket(_callback_handler) {
    var client = new net.Socket();
    client.on('data', function (data) {
        //console.log('Server Response: ', data.toString());
        _callback_handler(data.toString());
        client.end();
    });
    client.on('end', function () {
        //console.log("I'm disconnected");
    });
    return client;
}

module.exports.Set = function(name, data, cb) {
    var client = _new_socket(cb);
    client.connect(sockPath, function() {
        //console.log("I'm connected.");
        _set_data(name, data, client);
    });
};

module.exports.Get = function(name, cb) {
    var client = _new_socket(cb);
    client.connect(sockPath, function() {
        //console.log("I'm connected.");
        _get_data(name, client);
    });
};

module.exports.Drain = function(name, cb) {
    var client = _new_socket(cb);
    client.connect(sockPath, function() {
        //console.log("I'm connected.");
        _drain_data(name, client);
    });
}
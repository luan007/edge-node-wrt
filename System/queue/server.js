require("colors");
var fs = require("fs");
var path = require("path");
var net = require("net");
var sockPath = "/tmp/fdsock/light_queue.sock";

var Queue = {};
var ACTION = {};
ACTION.GET = "GET";
ACTION.SET = "SET";

function _ensure_queue(name){
    if(!Queue[name] || !Array.isArray(Queue[name]))
        Queue[name] = [];
}
function _dequeue(name) {
    _ensure_queue(name);
    return Queue[name].shift();
}
function _enqueue(name, data) {
    _ensure_queue(name);
    return Queue[name].push(data);
}

// { action: "", name: "", data: "" }
function _on_data(socket) {
    return function(data) {
        try {
            var json = JSON.parse(data.toString());
            if (json.hasOwnProperty("action") && json.hasOwnProperty("name") && json.hasOwnProperty("data")) {
                console.log("action", json.action, "name", json.name);
                if (json.action === ACTION.GET) {
                    var data = _dequeue(json.name)
                    socket.write(JSON.stringify(data));
                } else if (json.action === ACTION.SET) {
                    _enqueue(json.name, json.data);
                    socket.write("OK.");
                }
            }
            throw new Error("unknown request: " + json);
        } catch (err) {
            console.log(err.message.red);
            console.log(err.stack.toString().red);
            socket.end("please transfer JSON data.");
        }
    };
}


function _conn_listener(socket) {
    console.log('client connected');
    socket.on('end', function () {
        console.log('client disconnected');
    });
    socket.on('data', _on_data(socket));
}

function Initialize() {
    if (fs.existsSync(sockPath))
        fs.unlinkSync(sockPath);

    var server = net.createServer({
        allowHalfOpen: false,
        pauseOnConnect: false
    }, _conn_listener);

    server.listen(sockPath);
}

Initialize();



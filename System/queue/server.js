require("colors");
var fs = require("fs");
var path = require("path");
var net = require("net");
var sockPath = "/tmp/fdsock/light_queue.sock";
var dumpPath = "/tmp/fdsock/light_queue.dump"

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
    if(Queue[name].length) return Queue[name].shift();
    return {};
}
function _enqueue(name, data) {
    _ensure_queue(name);
    return Queue[name].push(data);
}
function _dump_queue(cb) {
    fs.writeFile(dumpPath, JSON.stringify(Queue), cb);
}
function _recover_queue() {
    if (fs.existsSync(dumpPath)) {
        try{
            var data = fs.readFileSync(dumpPath);
            Queue = JSON.parse(data);
            fs.unlinkSync(dumpPath);
        } catch(err) { console.log("some errors occured when recover JSON", err.message); }
    }
}
function _handle_error(error, cb){
    console.log(error.message.red);
    console.log(error.stack.toString().red);
    _dump_queue(cb);
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
                    console.log("CURRENT".green, Queue);
                } else if (json.action === ACTION.SET) {
                    _enqueue(json.name, json.data);
                    socket.write("OK.");
                    console.log("CURRENT".green, Queue);
                }
                else{
                    throw new Error("unsupported action: " + json.action);
                }
            } else {
                throw new Error("unknown request: " + json);
            }
        } catch (err) {
            _handle_error(err);
            socket.end(err.message);
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

    _recover_queue();

    var server = net.createServer({
        allowHalfOpen: false,
        pauseOnConnect: false
    }, _conn_listener);

    server.listen(sockPath);
}

process.on('uncaughtException', function (err) {
    _handle_error(err);
});
var domain = require('domain').create();
domain.on('error', function (err) {
    _handle_error(err);
});

domain.run(function () {
    Initialize();
});



import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
import uuid = require("uuid");
var Eureca = require('eureca.io');

require('../Env');
require('colors');
require('../../System/API/PermissionDef');

function getSock(id, root?): string {
    if (process.platform === "win32") {
        return "\\\\.\\pipe\\" + id;
    } else {
        if (!root) {
            return "/tmp/fdsock/" + id + ".t";
        }
        else {
            return root + "/" + id + ".t";
        }
    }
}

var UUIDstr = function (short = true): string {
    if (!short) return uuid.v4();
    var buf = new Buffer(16);
    uuid.v4(null, buf, 0);
    return buf.toString("hex");
}

export class Server extends events.EventEmitter {
    private __SOCK_PATH:string;
    private _api_server:net.Server = net.createServer({allowHalfOpen: true}, (socket) => {
        socket.pause();
        socket.on("error", (err) => {
            error(err);
            socket.destroy();
        });
        uscred.getCredentials(socket, (err, res) => {
            socket.resume();
        });

    });
    private eurecaServer = new Eureca.Server();

    constructor() {
        super();

        this.__SOCK_PATH = getSock(UUIDstr());
        this._api_server.listen(this.__SOCK_PATH, () => {
            exec("chown", "nobody", this.__SOCK_PATH, () => {
                exec("chmod", "777", this.__SOCK_PATH, () => {
                    console.log("API Port Permission is set");

                    this.eurecaServer.attach(this._api_server);

                    this.emit('ready');
                });
            });
        });

        this.eurecaServer.onConnect((connection) => {
            console.log('new Client', connection.id);
            var client = connection.clientProxy;

            //if we defined helloclient() function in the client side
            //we can call it like this
            var res = client.hello();
            console.log(res);
        });
    }

    public getSockPath() {
        return this.__SOCK_PATH;
    }

    public ShutDown() {
        this._api_server.close((err) => {
        });
    }

}
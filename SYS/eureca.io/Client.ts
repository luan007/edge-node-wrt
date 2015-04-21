import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
var Eureca = require('eureca.io');

export class Client {
    private sockPath:string;
    constructor(sockPath){
        this.sockPath = sockPath;
    }

    public Connect(){
        var client = new Eureca.Client({ uri: this.sockPath });

        client.exports.hello = () => {
            return 'hello';
        }
    }
}

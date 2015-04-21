import Server = require('./Server');
import Client = require('./Client');

var server = new Server.Server();
server.on('ready', () => {
    var sockPath = server.getSockPath();

    var client = new Client.Client(sockPath);
    client.Connect();
});

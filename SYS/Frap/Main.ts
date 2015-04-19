import Server = require('./Server');
import Client = require('./Client');

Server.Create();

process.nextTick(()=> {
    Client.Connect();
});

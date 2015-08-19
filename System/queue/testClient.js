var client = require("./client");

client.Get("holy", function(data) {
    console.log("RESP: ", data);
    client.Get("holy", function(data) {
        console.log("RESP: ", data);
    });
});
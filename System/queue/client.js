var client = require("./clientUtils");

client.Get("holy", function(data) {
    console.log("RESP: ", data);
    client.Get("holy", function(data) {
        console.log("RESP: ", data);
    });
});
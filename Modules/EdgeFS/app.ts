import EdgeFS = require("./index");


var fs = new EdgeFS.FileSystem();


var mirror = new EdgeFS.FS.Mirror("/test", "/mnt/tight");
var limit = new EdgeFS.Plugs.Limit(mirror.Size, 4096 * 10);
var wheels = new EdgeFS.Plugs.WheelsEncryptor();
wheels.GenerateKey(20);

fs.use(limit);
fs.use(wheels);
fs.use(mirror);


fs.start((err) => {
    console.log(err ? err : "Successfully Mounted");
}, true);
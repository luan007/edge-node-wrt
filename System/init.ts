//हिंदुस्तान एरोनॉटिक्स लिमिटेड
import child_process = require("child_process");
console.log(" * Init");
var target_node_modules = __dirname + ":" + process.argv[2];
process.env.NODE_PATH = target_node_modules;
console.log(target_node_modules);


//var kg = child_process.spawn("node", ["../Modules/EdgeFS/_Helper/killguard"], { env: process.env });
//kg.stdout.pipe(process.stdout);
//kg.stderr.pipe(process.stderr);
//kg.on("exit", () => {
//    console.log(" * KGD_FAIL");
//});


var sp = child_process.spawn("node", ["entry"], { env: process.env });
sp.stdout.pipe(process.stdout);
sp.stderr.pipe(process.stderr);
process.stdin.pipe(sp.stdin);
sp.on("exit", () => {
    console.log(" * SYS_FAIL");
});

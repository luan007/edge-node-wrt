var child_process = require("child_process");
console.log(" * Init");
var target_node_modules = __dirname + ":" + process.argv[2];
process.env.NODE_PATH = target_node_modules;
console.log(target_node_modules);
var sp = child_process.spawn("node", ["entry"], { env: process.env });
sp.stdout.pipe(process.stdout);
sp.stderr.pipe(process.stderr);
process.stdin.pipe(sp.stdin);
sp.on("exit", function () {
    console.log(" * SYS_FAIL");
});

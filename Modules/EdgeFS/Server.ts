var child_process = require('child_process');

var kg = child_process.spawn("node", ["./_Helper/killguard"], { env: process.env });
kg.stdout.pipe(process.stdout);
kg.stderr.pipe(process.stderr);
kg.on("exit", () => {
    console.log(" * KGD_FAIL");
});
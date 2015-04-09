var rl = require("readline-sync");
rl.question("DESTROY CURRENT DB, CONTINUE? (anykey)");
var childprocess = require("child_process");
childprocess.exec("rm -rf ../_data", function (err, std, e) {
    console.log("Bye");
});

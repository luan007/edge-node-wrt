import fs = require("fs");
var rl = require("readline-sync");

rl.question("DESTROY CURRENT DB, CONTINUE? (anykey)");

import childprocess = require("child_process");
childprocess.exec("rm -rf ../_data",(err, std, e) => {
    console.log("Bye");
});
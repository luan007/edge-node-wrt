global.C = 5;
console.log("I'm C");
require("../test");
import fs = require("fs");
console.log(fs.readdirSync("/"));
console.log(API);
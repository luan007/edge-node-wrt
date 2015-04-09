var cli = require('cli_debug');
var Core = require("Core");
var Node = require("Node");
SYS_ON(0 /* LOADED */, function () {
    if (CONF.IS_DEBUG && CONF.INTERACTIVE_DEBUG) {
        setTimeout(function () {
            warn(" ** EDGE INTERACTIVE DEBUG **");
            global.Core = global.c = Core;
            global.Node = global.n = Node;
            cli.debug();
        }, 3000);
    }
});

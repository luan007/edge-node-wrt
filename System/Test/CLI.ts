var cli:any = require('cli_debug');
import Core = require("Core");
import Node = require("Node");


SYS_ON(SYS_EVENT_TYPE.LOADED,() => {
    if (CONF.IS_DEBUG && CONF.INTERACTIVE_DEBUG) {
        setTimeout(() => {
            warn(" ** EDGE INTERACTIVE DEBUG **");
            cli.debug();
        }, 3000);
    }
});
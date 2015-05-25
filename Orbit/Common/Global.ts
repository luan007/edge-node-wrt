var os = require("os");
var path = require('path');

class _orbit_sys_global_conf {
    IS_DEBUG = true;
    BASE_PATH = process.env.ROOT_PATH;
    APP_BASE_PATH = path.join(this.BASE_PATH,  "../Applications/");
}

var ORBIT_CONF = new _orbit_sys_global_conf();
global.ORBIT_CONF = ORBIT_CONF;

var os = require("os");
var path = require('path');

class _orbit_sys_global_conf {
    IS_DEBUG = true;
    BASE_PATH = process.env.ROOT_PATH;
    APP_BASE_PATH = path.join(this.BASE_PATH,  "../Applications/");
    PKG_BASE_PATH = path.join(this.BASE_PATH, "../Packages");
    GRAPHD_LOCATION = path.join(this.BASE_PATH, "./GraphD/deltaV");
    GRAPHD_UPGRADE_LOCATION = path.join(this.BASE_PATH, "./GraphD");
    GRAPHD_CLASSES_LOCATION = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.classes.json");
    GRAPHD_ATTRIBUTES_LOCATION = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.attributes.json");
    GRAPHD_ACTIONS_LOCATION = path.join(this.GRAPHD_UPGRADE_LOCATION, "graphd.actions.json");
    PKG_TMP_PATH = path.join(this.PKG_BASE_PATH, 'tmp');
}

var ORBIT_CONF = new _orbit_sys_global_conf();
global.ORBIT_CONF = ORBIT_CONF;

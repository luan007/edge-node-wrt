var os = require("os");
var path = require('path');

class _orbit_sys_global_conf {
    IS_DEBUG = true;
    BASE_PATH = process.env.ROOT_PATH;
    APP_BASE_DIR = path.join(this.BASE_PATH,  "../Applications/");
    PKG_BASE_DIR = path.join(this.BASE_PATH, "../Packages");
    GRAPHD_DIR = path.join(this.BASE_PATH, "./GraphD/deltaV");
    GRAPHD_UPGRADE_DIR = path.join(this.BASE_PATH, "./GraphD");
    GRAPHD_PACKAGE_LOCATION = path.join(this.PKG_BASE_DIR, 'graphd.zip');
    GRAPHD_CLASSES_LOCATION = path.join(this.GRAPHD_UPGRADE_DIR, "graphd.classes.json");
    GRAPHD_ATTRIBUTES_LOCATION = path.join(this.GRAPHD_UPGRADE_DIR, "graphd.attributes.json");
    GRAPHD_ACTIONS_LOCATION = path.join(this.GRAPHD_UPGRADE_DIR, "graphd.actions.json");
    PKG_TMP_DIR = path.join(this.PKG_BASE_DIR, 'tmp');
}

var ORBIT_CONF = new _orbit_sys_global_conf();
global.ORBIT_CONF = ORBIT_CONF;

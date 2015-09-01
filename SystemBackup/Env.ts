process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

global.path = require("path");
global.http = require("http");
global.fs = require("fs");
global.child_process = require('child_process');
global.qs = require("querystring");
global.async = require("async");
global._ = require("underscore");
require("colors");
require("../Modules/Shared/use");
require("./Libs/Tools/Commands");
require("./CI/SectionConst");

global.Agency = require("./Libs/Tools/Agency");
global.Utils = require("./Libs/Tools/Utils");
global.Dnsmasq = require("./Libs/Network/Dnsmasq");
global.Hostapd = require("./Libs/Network/Hostapd");
global.Udhcpc = require("./Libs/Network/Udhcpc");
global.WifiBus = require("./Device/Bus/WifiBus");
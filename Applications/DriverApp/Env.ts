global.path = require("path");
global.http = require("http");
global.qs = require("querystring");
global.async = require("async");
global._ = require("underscore");
require("colors");
global.trace = global.warn = global.error = global.fatal = global.debug = global.info = console.log;
require('../Modules/Shared/use');
require("../Modules/Shared/Crypto/HashDir");

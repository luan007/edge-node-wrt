global.path = require("path");
global.http = require("http");
global.qs = require("querystring");
global.async = require("async");
require("colors");
require('../System/Base/Global');
require('../System/SubSys/Native/commands');
require('../Modules/Shared/Basic/flowcontrol');
require('../Modules/Shared/Crypto/UUID');
require('../System/Lib/Log/Prelaunch');

import APIServer = require('./APIServer');


process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;

global.LOG_VISIBLE = false;
global.LOG_SEE_FATAL = true;
global.LOG_SEE_ERROR = true;
global.path = require("path");
global.http = require("http");
global.fs = require("fs");
global.child_process = require('child_process');
global.qs = require("querystring");
global.async = require("async");
global._ = require("underscore");
require("colors");
require("./Common/Conf/Global");
require('../Modules/Shared/use');
require("../Modules/Shared/Sockets/SockPath");
require("../Modules/Shared/Log/Prelaunch");
require("../Modules/Shared/Log/Logger");
require("./API/FunctionExposer");
require("./API/EventHub");
require("./Common/Native/commands");
require("./Common/Stat/StatMgr");
require('./Common/Remote/Client');
require("./Common/Crypto/HashDir");
require("./Common/Crypto/RSA");
require("./Common/IO/fifo");
require("./Common/Events/SystemEvent");
require("./Common/Runtime/Diagnostic");

Turn("api:functionexposer", true);
Turn("common:native:hostapd", true);
Turn("Common:Native:mdns", true);
Turn("Frontends:Thirdparty", true);
Turn("APP:Runtime", true);
Turn("APP:RuntimePool", true);


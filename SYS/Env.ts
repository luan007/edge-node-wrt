global.path = require("path");
global.http = require("http");
global.fs = require("fs");
global.child_process = require('child_process');
global.qs = require("querystring");
global.async = require("async");
global._ = require("underscore");
require("colors");
require("../Modules/Shared/Log/Prelaunch");
require('../Modules/Shared/use');
require("./Common/Conf/Global");
require("./Common/Stat/StatMgr");
require('./Common/Remote/Client');
require("./Common/Crypto/HashDir");
require("./Common/Crypto/RSA");
require("./Common/IO/fifo");
require("./Common/Events/SystemEvent");
require("../Modules/Shared/Sockets/SockPath");
require("./API/FunctionExposer");
require("./API/EventHub");
require("./Common/Runtime/Diagnostic");
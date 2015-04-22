import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
import RPC = require('../../Modules/RPC/index');
import Process = require("../../System/SubSys/Native/Process");
import sockPath = require('../../System/Lib/Sockets/SockPath');
import pm = require('../../System/API/Permission');
import APIConfig = require('../APIConfig');
import APIManager = require('./APIManager');
import _MountTable = require('../MountTable');
import MountTable = _MountTable.MountTable;
import EventsHub = require('../EventsHub');

var dnode = require('dnode');

sockPath.Initialize();
var localSockPath = getSock(UUIDstr());

export function Initalize(sockPathServer:string){
    warn('consumer - PID', process.pid);

    var api = APIManager.GetAPI(sockPathServer)
}

(function () {
    var sockPath = process.argv[2];
    trace('socketPath', sockPath);
    Initalize(sockPath);
})();
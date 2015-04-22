import net = require("net");
import events = require('events');
import uscred = require("unix-socket-credentials");
import RPC = require('../../Modules/RPC/index');
import Process = require("../../System/SubSys/Native/Process");
import sockPath = require('../../System/Lib/Sockets/SockPath');
import pm = require('../../System/API/Permission');
import APIConfig = require('../APIConfig');
import _MountTable = require('../MountTable');
import MountTable = _MountTable.MountTable;
import EventsHub = require('../EventsHub');

var axon = require('axon');
var sockLocal = axon.socket('rep');
var sockServer = axon.socket('req');

sockPath.Initialize();
var localSockPath = getSock(UUIDstr());

export function Initalize(sockPathServer:string){
    warn('consumer - PID', process.pid);

    sockLocal.bind(localSockPath);

    sockServer.connect(sockPathServer);


    //sock.send('ServiceA.FakeA', (res) => {
    //    console.log(res);
    //});
    //sock.on('error', function (err) {
    //    error(err);
    //});
}
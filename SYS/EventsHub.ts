import RPC = require('../Modules/RPC/index');

var RPCs = [];

export function Emit(eventId, ...data){
    RPCs.forEach(function(rpc:RPC.RPCEndpoint){
        rpc.Emit(eventId, data);
    });
}

export function RegisterRPC(rpc: RPC.RPCEndpoint){
    RPCs.push(rpc);
}
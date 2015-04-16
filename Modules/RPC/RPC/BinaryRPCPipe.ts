import net = require("net");
import events = require("events");
import BinaryFramedSocket = require("../Lib/BinaryFramedSocket");
import ExArray = require("../Lib/ExtendedArray");
import APIError = require("../Lib/APIError");
import Definition = require('./Definition');

export class BinaryRPCPipe extends events.EventEmitter {

    private _sock: BinaryFramedSocket;

    private _callbacks = new ExArray<{
        callback: Function;
        timer: number;
        peer: BinaryRPCPipe;
        trackid;
        ageid;
    }>(2048);

    //private _eventCallbacks:{[key: number]: Array<Function>} = {};

    public TimeOut: number = 10000;

    private _call_handler: Function;

    private _event_handler: Function;

    private _is_ready = -1;

    constructor(socket: net.Socket) {
        super();
        this._sock = new BinaryFramedSocket(socket);
        this._sock.FrameOutput = false;
        this._sock.on("header", this._sock_on_header);
        this._sock.on("error", (err) => {
            if (this._sock) {
                this.emit("error", err);
            }
        });
        this._sock.on("close", () => {
            this.emit("close");
        });
    }

    public SetEventHandler = (on_all_event) => {
        this._event_handler = on_all_event;
    }

    public SetFunctionHandler = (on_all_function) => {
        this._call_handler = on_all_function;
    }

    public ClearAllHandlers = () => {
        this._call_handler = undefined;
        this._event_handler = undefined;
    };

    public Destroy = () => {
        this.ClearAllHandlers();
        if (!this._sock) {
            return;
        }
        this.removeAllListeners();
        this._sock.Unbind();
        this._sock = undefined;
    };

    private _sock_on_header = (header: Buffer, frame: events.EventEmitter) => {
        //console.log("RPC_I < " + obj);
        var type = <Definition.RPC_Message_Type>header.readInt8(4);
        var resourceid = header.readUInt32LE(5);
        var trackid = header.readUInt32LE(9);
        var ageid = header.readUInt32LE(13);
        var rewire_target : BinaryRPCPipe = undefined;
        switch (type) {
            case Definition.RPC_Message_Type.__REQUEST:
                rewire_target = this._on_remote_call(resourceid, trackid, ageid);
                this.ForwardCall(rewire_target, header, frame);
                break;
            case Definition.RPC_Message_Type.__RESPONSE:
                this._on_remote_reply(header, frame, trackid, ageid);
                break;
            case Definition.RPC_Message_Type.__EVENT:
                rewire_target = this._on_emit_event(resourceid);
                this.ForwardEvent(<any>rewire_target, header, frame);
                break;
            case Definition.RPC_Message_Type.__READY:
                //do nothing
                //this._on_ready(); //dummy
                break;
        }
    };
    
    private Send_Pack = (type: Definition.RPC_Message_Type, func_or_event_id: number, params: any, trackId = 0, gen = 0) => {
        if (!this._sock) return;
        params = Array.isArray(params) ? params : [];
        //create header
        var header = new Buffer(1 + 4 + 4 + 4);
        header.writeInt8(type, 0);
        header.writeUInt32LE(func_or_event_id, 1);
        header.writeUInt32LE(trackId, 1);
        header.writeUInt32LE(gen, 1);
        var body = params;
        var data = JSON.stringify(body);
        this._sock.Send(header, data);
    };

    private _on_ready = () => {
        //not implemented
        return undefined;
    };

    private _on_remote_call = (funcId, trackid, age) => {
        if(this._call_handler) {
            return this._call_handler(funcId, trackid, age);
        }
        return undefined;
    };

    private _on_remote_reply = (header, frame, trackid, age) => {
        if (this._callbacks.age(trackid) == age) {
            var _cb = this._callbacks.pop(trackid);
            if (_cb && _cb.callback) {
                this.ForwardReply(_cb.peer, header, frame, _cb.trackid, _cb.ageid);
                clearTimeout(_cb.timer);
            }
        } else {
            //Function Aged out.
        }
        return undefined;
    };

    private _on_emit_event = (eventId) => {
        if (this._event_handler) {
            return this._event_handler(eventId);
        }
        return undefined;
    };

    private _time_out_closure = (track_id, gen) => {
        var timer = setTimeout(() => {
            if (this._callbacks.age(track_id) == gen) {
                var obj = this._callbacks.pop(track_id);
                if (obj && obj.callback) {
                    obj.callback(new Error("Proxy Time-out"), undefined);
                }
            }
            clearTimeout(timer);
        }, this.TimeOut);
        return timer;
    };

    private ForwardReply = (peer : BinaryRPCPipe, header, frame, originalTrack, originalAge) => {
        if(!(peer && peer._sock && this._sock)) return;
        var type = <Definition.RPC_Message_Type>header.readInt8(4);
        var resourceid = header.readUInt32LE(5);
        var trackid = header.readUInt32LE(9);
        var ageid = header.readUInt32LE(13);
        //MASQR
        header.writeUInt32LE(originalTrack, 9);
        header.writeUInt32LE(originalAge, 13);
        intoQueue(peer._sock.Id, (sent) => {
            peer._sock.RawWrite(header);
            frame.on('data', function(buf){
                peer._sock.RawWrite(buf);
            });
            frame.on('end', sent);
        }, ()=>{});
    };

    private ForwardCall = (peer : BinaryRPCPipe, header, frame) => {
        if(!(peer && peer._sock && this._sock)) return;
        var resourceid = header.readUInt32LE(5);
        var trackid = header.readUInt32LE(9);
        var ageid = header.readUInt32LE(13);
        var callback = (err) => {
            return this.Send_Pack(Definition.RPC_Message_Type.__RESPONSE, resourceid, [Definition.ConvertError(err)], trackid, ageid);
        };
        var callback_sig = {
            callback: callback,
            timer: undefined,
            trackid: trackid, //original
            ageid: ageid, //original
            peer: peer
        };
        var track_id = this._callbacks.push(callback_sig);
        var gen = this._callbacks.age(track_id);

        callback_sig.timer = this._time_out_closure(track_id, gen);

        //MASQR
        header.writeUInt32LE(track_id, 9);
        header.writeUInt32LE(gen, 13);

        intoQueue(peer._sock.Id, (sent) => {
            peer._sock.RawWrite(header);
            frame.on('data', function(buf){
                peer._sock.RawWrite(buf);
            });
            frame.on('end', sent);
        }, ()=>{});
    };

    private ForwardEvent = (peer : BinaryRPCPipe[], header, frame) => {
        if((this._sock && peer)) return;
        var resourceid = header.readUInt32LE(5);
        var trackid = header.readUInt32LE(9);
        var ageid = header.readUInt32LE(13);

        for(var i = 0; i < peer.length; i++) {
            if(!peer[i]._sock) continue;
            intoQueue(peer[i]._sock.Id, (sent) => {
                peer[i]._sock.RawWrite(header);
                frame.on('data', function (buf) {
                    peer[i]._sock.RawWrite(buf);
                });
                frame.on('end', sent);
            }, ()=> {
            });
        }
    };

}

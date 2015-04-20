import net = require("net");
import events = require("events");
//import BinaryFramedSocket = require("../Lib/BinaryFramedSocket");
import ExArray = require("../Lib/ExtendedArray");
import APIError = require("../Lib/APIError");
import Definition = require('./Definition');
import msgpack = require('msgpack');
import Frap = require('frap');

export class BinaryRPCEndpoint extends events.EventEmitter {

    //private _sock:BinaryFramedSocket;
    private _sock;

    private _callbacks = new ExArray<{
        callback: Function;
        timer: number;
    }>(1024);

    //private _eventCallbacks:{[key: number]: Array<Function>} = {};

    public TimeOut:number = 10 * 60 * 1000;

    private _call_handler:Function;

    private _event_handler:Function;

    private _is_ready = -1;

    constructor(socket:net.Socket) {
        super();
        this._sock = new Frap(socket);
        //this._sock = new BinaryFramedSocket(socket);
        this._sock.on("header", this._parse_header);
        this._sock.on("end", this._on_end);
        //this._sock.on("frame", this._parse_frame);
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
        this._sock.destroySoon();
        //this._sock.Unbind();
        this._sock = undefined;
    };

    private _pkg_check = (pkg):boolean => {
        if (Array.isArray(pkg)) {
            //TODO: Add More logic here
            return true;
        }
        return false;
    };

    private _on_end = () => {
        trace('_on_end');
    }

    private _parse_header = (frameLen) => {
        trace('[', process.pid, '] 1. Endpoint Frame Length', frameLen);
        var headerLength = 1 + 4 + 4 + 4;
        var headerBuffer = new Buffer(headerLength);
        var bufs = [];

        var rstream = this._sock.createReadFrameStream(frameLen);
        rstream.pause();

        if(frameLen === headerLength){
            rstream.on('data', (d:Buffer) => {
                headerBuffer = new Buffer(d);
            });
            rstream.resume();
        } else {
            rstream.on('data', (d:Buffer) => {
                bufs.push(new Buffer(d));
            });
        }
        rstream.on('end', () => {
            rstream.removeAllListeners();
            trace('[', process.pid, '] 1. end', bufs, headerBuffer);
        });
        rstream.resume();
        //var rstream = this._sock.createReadFrameStream(frameLen);
        //rstream.pause();

        //this._find_header(rstream, frameLen);
    }

    private _find_header = (rstream, framelen) => {
        var headerLength = 1 + 4 + 4 + 4;
        var headerBuffer = new Buffer(headerLength);
        var headerPos = 0;
        var beforeStart:Buffer = undefined;
        rstream.on('data', (d:Buffer) => {
            rstream.pause();
            rstream.removeAllListeners('data');
            var cursor = d.copy(headerBuffer, headerPos, 0, d.length >= (headerLength - headerPos) ? (headerLength - headerPos) : d.length);
            headerPos += cursor;
            if (headerPos === headerLength) {
                rstream.pause();
                beforeStart = d.slice(cursor);

                //emit old header event
                this._read_last(headerBuffer, rstream, beforeStart, framelen);
            }
        });
        rstream.resume();
    };

    private _read_last = (headerBuffer, rstream, beforesStart, framelen) => {
        var bufs = [];
        if(beforesStart) bufs.push(beforesStart);
        rstream.on('data', (buf) => {
            bufs.push(buf);
        });
        rstream.on('end', () => {
            rstream.removeAllListeners();
            this._sock_on_frame(headerBuffer, bufs);
        });
    };

    private _parse_frame = (bufs, framelen) => {
        trace('[', process.pid, '] 1. Endpoint Frame Length', framelen);

        var headerBuffer = bufs.shift();
        this._sock_on_frame(headerBuffer, bufs);
    };

    private _sock_on_frame = (header:Buffer, obj) => {

        if (!this._pkg_check(obj)) {
            return this.emit("bad_obj", obj);
        }


        //console.log(obj);
        //console.log(header.readInt8(4));
        switch (header.readInt8(4)) {
            case Definition.RPC_Message_Type.__REQUEST:
                this._on_remote_call(header.readInt32LE(5), header.readInt32LE(9), header.readInt32LE(13), obj);
                break;
            case Definition.RPC_Message_Type.__RESPONSE:
                this._on_remote_reply(header.readInt32LE(5), header.readInt32LE(9), header.readInt32LE(13), obj);
                break;
            case Definition.RPC_Message_Type.__EVENT:
                this._on_emit_event(header.readInt32LE(5), obj);
                break;
            case Definition.RPC_Message_Type.__READY:
                this._on_ready(obj[0], obj[1]); //dummy
                break;
        }

    };

    private _time_out_closure = (track_id, gen) => {
        var timer = setTimeout(() => {
            if (this._callbacks.age(track_id) == gen) {
                var obj = this._callbacks.pop(track_id);
                if (obj && obj.callback) {
                    obj.callback(new Error("Operation Time-out"), undefined);
                }
            }
            clearTimeout(timer);
        }, this.TimeOut);
        return timer;
    };

    private _func_time_out = (cb) => {
        var timer = setTimeout(() => {
            cb(new Error("Remote Time-out"), undefined);
        }, this.TimeOut);
        return timer;
    };

    private Send_Pack = (type:Definition.RPC_Message_Type, func_or_event_id:number, params:any, trackId = 0, gen = 0) => {
        if (!this._sock) return;
        params = Array.isArray(params) ? params : [];
        //create header
        var header = new Buffer(1 + 4 + 4 + 4);
        header.writeInt8(type, 0);
        header.writeInt32LE(func_or_event_id, 1);
        header.writeInt32LE(trackId, 5);
        header.writeInt32LE(gen, 9);
        var body = params;
        var data = msgpack.pack(body);
        //var data = JSON.stringify(body);
        this._sock.sendFrame(header, data);
        //this._sock.sendFrame( data);

        //this._sock.Send(header, data);
    };

    private _on_ready = (chk1, chk2) => {
        if (this._is_ready === -1 //Passive 1
            && chk1 === 0         //    host(0) ---(0,1)--->slave(-1)
            && chk2 === 1) {
            //console.log("Slave Passive 1");
            this._is_ready = 0;   //    host(0) ---     --- slave(0) -- THIS is SLAVE
            this.Send_Pack(Definition.RPC_Message_Type.__READY, 0, [1, 0]);
        }
        else if (this._is_ready === 0   //Rebounce 2
            && chk1 === 1               //      slave(0) --- (1,0) --- host(1)
            && chk2 === 0) {            // HOST understands dual connectivity
            this._is_ready = 1;
            //console.log("Host Rebounce 2");
            this.emit("ready");
            this.Send_Pack(Definition.RPC_Message_Type.__READY, 0, [0, 1]);
        }
        else if (this._is_ready === 0   //FIN 3
            && chk1 === 0               //      host(1) --- (1,0) --- slave(0)
            && chk2 === 1) {
            this._is_ready = 1;
            //console.log("Slave Final 3");
            this.emit("ready");         //SLAVE READY, host is faster than slave (1 hop)
        }
    };

    private _on_remote_call = (funcId, trackid, age, params) => {
        var timeout;
        var cb = (err:Error, result) => {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            if (!cb['']) {
                cb[''] = 1;
                return this.Send_Pack(Definition.RPC_Message_Type.__RESPONSE, funcId, [Definition.ConvertError(err), result], trackid, age);
            }
        };
        timeout = this._func_time_out(cb);
        try {
            this._call_handler(funcId, params, cb);
        } catch (e) {
            return cb(Definition.ConvertError(e), undefined);
        }
    };

    private _on_remote_reply = (funcId, trackid, age, params) => {
        //console.log('OUT Cb ', trackid, age);
        //console.log(this._callbacks);
        if (this._callbacks.age(trackid) == age) {
            //console.log('IN Cb ');
            var _cb = this._callbacks.pop(trackid);
            if (_cb && _cb.callback) {
                //console.log('CALLING Cb');
                //console.log(_cb.callback.toString());
                _cb.callback(params[0], params[1]);
                clearTimeout(_cb.timer);
            }
        } else {
            //Function Aged out.
        }
    };

    private _on_emit_event = (eventId, params) => {
        if (this._event_handler) {
            this._event_handler(eventId, params);
        }
    };

    public Call = (remote_func_id, params:any[], callback:Function) => {
        if (callback !== undefined) {
            callback = callback.bind({});
        }
        var callback_sig = {
            callback: callback,
            timer: undefined
        };
        var track_id = this._callbacks.push(callback_sig);
        var gen = this._callbacks.age(track_id);
        callback_sig.timer = this._time_out_closure(track_id, gen);
        this.Send_Pack(Definition.RPC_Message_Type.__REQUEST, remote_func_id, params, track_id, gen);
    };

    public Emit = (remote_event_id, params:any[]) => {
        //trace('Emit', remote_event_id, params);
        this.Send_Pack(Definition.RPC_Message_Type.__EVENT, remote_event_id, params);
    };

    public Ready = () => {
        if (this._is_ready < 0) {
            this._is_ready = 0;
            //console.log("Handshake 0");
            this.Send_Pack(Definition.RPC_Message_Type.__READY, 0, [0, 1]);
            return true;
        } else {
            return false;
        }
    };
}

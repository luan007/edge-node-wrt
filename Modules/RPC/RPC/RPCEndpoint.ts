import net = require("net");
import events = require("events");
import FramedSocket = require("../Lib/FramedSocket");
import ExArray = require("../Lib/ExtendedArray");
import APIError = require("../Lib/APIError");

enum RPC_Message_Type { _REQUEST = 0, __RESPONSE = 1, __EVENT = 2, __READY = 3 }

//Package Format:
//[ MSG TYPE(number), TARGET_ID(number), PARAMS(object), ?TRACK_ID(number), ?GENERATION_, ... _LAST_CHK_SUM ]
//                                  ^ (func id / or event id)

function ConvertError(err: Error) {
    return err ? {
        message: err.message,
        name: err.name,
        code: err["code"]
    } : undefined;
}

export class RPCEndPoint extends events.EventEmitter {

    private _sock: FramedSocket;

    private _callbacks = new ExArray<{
        callback: Function;
        timer: number;
    }>(2048);

    public TimeOut: number = 10000;

    private _call_handler: Function;

    private _event_handler: Function;

    private _is_ready = -1;

    constructor(socket: net.Socket) {
        super();
        this._sock = new FramedSocket(socket);
        this._sock.on("frame", this._sock_on_frame);
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

    private _pkg_check = (pkg): boolean => {
        if (Array.isArray(pkg) && pkg.length > 2) {
            //TODO: Add More logic here
            return true;
        }
        return false;
    };

    private _sock_on_frame = (obj) => {
        //console.log("RPC_I < " + obj);
        if (!this._pkg_check(obj)) {
            return this.emit("bad_obj", obj);
        }
        switch (obj[0]) {
            case RPC_Message_Type._REQUEST:
                this._on_remote_call(obj[1], obj[2], obj[3], obj[4]);
                break;
            case RPC_Message_Type.__RESPONSE:
                this._on_remote_reply(obj[1], obj[2], obj[3], obj[4]);
                break;
            case RPC_Message_Type.__EVENT:
                this._on_emit_event(obj[1], obj[2]);
                break;
            case RPC_Message_Type.__READY:
                this._on_ready(obj[2][0], obj[2][1]); //dummy
                break;
        }

    };

    private _time_out_closure = (reason, track_id, gen) => {
        var timer = setTimeout(() => {
                if (this._callbacks.age(track_id) == gen) {
                    var obj = this._callbacks.pop(track_id);
                    if (obj && obj.callback) {
                        obj.callback(new Error("RPC Operation Time-out"), undefined);
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

    private Send_Pack = (type: RPC_Message_Type, func_or_event_id: number, params: any, trackId?: number, gen?: number) => {
        if (!this._sock) return;

        params = Array.isArray(params) ? params : [];
        var Package = [
            type,
            func_or_event_id,
            params
        ]; //Create array directly
        if (trackId !== undefined) {
            Package.push(trackId);
            Package.push(gen); //implemented by us.
        }

        //console.log("RPC_O > " + Package);
        this._sock.Send(Package);
    };

    private _on_ready = (chk1, chk2) => {
        if (this._is_ready === -1 //Passive 1
            && chk1 === 0         //    host(0) ---(0,1)--->slave(-1)
            && chk2 === 1) {
            //console.log("Slave Passive 1");
            this._is_ready = 0;   //    host(0) ---     --- slave(0) -- THIS is SLAVE
            this.Send_Pack(RPC_Message_Type.__READY, 0, [1, 0]);
        }
        else if (this._is_ready === 0   //Rebounce 2
            && chk1 === 1               //      slave(0) --- (1,0) --- host(1)
            && chk2 === 0) {            // HOST understands dual connectivity
            this._is_ready = 1;
            //console.log("Host Rebounce 2");
            this.emit("ready");
            this.Send_Pack(RPC_Message_Type.__READY, 0, [0, 1]);
        }
        else if (this._is_ready === 0   //FIN 3
            && chk1 === 0               //      host(1) --- (1,0) --- slave(0)
            && chk2 === 1) {
            this._is_ready = 1;
            //console.log("Slave Final 3");
            this.emit("ready");         //SLAVE READY, host is faster than slave (1 hop)
        }
    };

    private _on_remote_call = (funcId, params, trackid, age) => {
        var timeout;
        var cb = (err: Error, result) => {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            if (!cb['']) {
                cb[''] = 1;
                return this.Send_Pack(RPC_Message_Type.__RESPONSE, funcId, [ConvertError(err), result], trackid, age);
            }
        };
        timeout = this._func_time_out(cb);
        try {
            this._call_handler(funcId, params, cb);
        } catch (e) {
            return cb(ConvertError(e), undefined);
        }
    };

    private _on_remote_reply = (funcId, params, trackid, age) => {
        if (this._callbacks.age(trackid) == age) {
            var _cb = this._callbacks.pop(trackid);
            if (_cb && _cb.callback) {
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

    public Call = (remote_func_id, params: any[], callback: Function) => {
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
        this.Send_Pack(RPC_Message_Type._REQUEST, remote_func_id, params, track_id, gen);
        return [ track_id, gen ];
    };

    public Emit = (remote_event_id, params: any[]) => {
        this.Send_Pack(RPC_Message_Type.__EVENT, remote_event_id, params);
    };

    public Ready = () => {
        if (this._is_ready < 0) {
            this._is_ready = 0;
            //console.log("Handshake 0");
            this.Send_Pack(RPC_Message_Type.__READY, 0, [0, 1]);
            return true;
        } else {
            return false;
        }
    };
}

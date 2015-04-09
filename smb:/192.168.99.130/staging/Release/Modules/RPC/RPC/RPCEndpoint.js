var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var FramedSocket = require("../Lib/FramedSocket");
var ExArray = require("../Lib/ExtendedArray");
var RPC_Message_Type;
(function (RPC_Message_Type) {
    RPC_Message_Type[RPC_Message_Type["_REQUEST"] = 0] = "_REQUEST";
    RPC_Message_Type[RPC_Message_Type["__RESPONSE"] = 1] = "__RESPONSE";
    RPC_Message_Type[RPC_Message_Type["__EVENT"] = 2] = "__EVENT";
    RPC_Message_Type[RPC_Message_Type["__READY"] = 3] = "__READY";
})(RPC_Message_Type || (RPC_Message_Type = {}));
function ConvertError(err) {
    return err ? {
        message: err.message,
        name: err.name,
        code: err["code"]
    } : undefined;
}
var RPCEndPoint = (function (_super) {
    __extends(RPCEndPoint, _super);
    function RPCEndPoint(socket) {
        var _this = this;
        _super.call(this);
        this._callbacks = new ExArray(2048);
        this.TimeOut = 10000;
        this._is_ready = -1;
        this.SetEventHandler = function (on_all_event) {
            _this._event_handler = on_all_event;
        };
        this.SetFunctionHandler = function (on_all_function) {
            _this._call_handler = on_all_function;
        };
        this.ClearAllHandlers = function () {
            _this._call_handler = undefined;
            _this._event_handler = undefined;
        };
        this.Destroy = function () {
            _this.ClearAllHandlers();
            if (!_this._sock) {
                return;
            }
            _this.removeAllListeners();
            _this._sock.Unbind();
            _this._sock = undefined;
        };
        this._pkg_check = function (pkg) {
            if (Array.isArray(pkg) && pkg.length > 2) {
                return true;
            }
            return false;
        };
        this._sock_on_frame = function (obj) {
            if (!_this._pkg_check(obj)) {
                return _this.emit("bad_obj", obj);
            }
            switch (obj[0]) {
                case 0 /* _REQUEST */:
                    _this._on_remote_call(obj[1], obj[2], obj[3], obj[4]);
                    break;
                case 1 /* __RESPONSE */:
                    _this._on_remote_reply(obj[1], obj[2], obj[3], obj[4]);
                    break;
                case 2 /* __EVENT */:
                    _this._on_emit_event(obj[1], obj[2]);
                    break;
                case 3 /* __READY */:
                    _this._on_ready(obj[2][0], obj[2][1]);
                    break;
            }
        };
        this._time_out_closure = function (track_id, gen) {
            var timer = setTimeout(function () {
                if (_this._callbacks.age(track_id) == gen) {
                    var obj = _this._callbacks.pop(track_id);
                    if (obj && obj.callback) {
                        obj.callback(new Error("Operation Time-out"), undefined);
                    }
                }
                clearTimeout(timer);
            }, _this.TimeOut);
            return timer;
        };
        this._func_time_out = function (cb) {
            var timer = setTimeout(function () {
                cb(new Error("Remote Time-out"), undefined);
            }, _this.TimeOut);
            return timer;
        };
        this.Send_Pack = function (type, func_or_event_id, params, trackId, gen) {
            if (!_this._sock)
                return;
            params = Array.isArray(params) ? params : [];
            var Package = [
                type,
                func_or_event_id,
                params
            ];
            if (trackId !== undefined) {
                Package.push(trackId);
                Package.push(gen);
            }
            _this._sock.Send(Package);
        };
        this._on_ready = function (chk1, chk2) {
            if (_this._is_ready === -1 && chk1 === 0 && chk2 === 1) {
                _this._is_ready = 0;
                _this.Send_Pack(3 /* __READY */, 0, [1, 0]);
            }
            else if (_this._is_ready === 0 && chk1 === 1 && chk2 === 0) {
                _this._is_ready = 1;
                _this.emit("ready");
                _this.Send_Pack(3 /* __READY */, 0, [0, 1]);
            }
            else if (_this._is_ready === 0 && chk1 === 0 && chk2 === 1) {
                _this._is_ready = 1;
                _this.emit("ready");
            }
        };
        this._on_remote_call = function (funcId, params, trackid, age) {
            var timeout;
            var cb = function (err, result) {
                if (timeout !== undefined) {
                    clearTimeout(timeout);
                }
                if (!cb['']) {
                    cb[''] = 1;
                    return _this.Send_Pack(1 /* __RESPONSE */, funcId, [ConvertError(err), result], trackid, age);
                }
            };
            timeout = _this._func_time_out(cb);
            try {
                _this._call_handler(funcId, params, cb);
            }
            catch (e) {
                return cb(ConvertError(e), undefined);
            }
        };
        this._on_remote_reply = function (funcId, params, trackid, age) {
            if (_this._callbacks.age(trackid) == age) {
                var _cb = _this._callbacks.pop(trackid);
                if (_cb && _cb.callback) {
                    _cb.callback(params[0], params[1]);
                    clearTimeout(_cb.timer);
                }
            }
            else {
            }
        };
        this._on_emit_event = function (eventId, params) {
            if (_this._event_handler) {
                _this._event_handler(eventId, params);
            }
        };
        this.Call = function (remote_func_id, params, callback) {
            if (callback !== undefined) {
                callback = callback.bind({});
            }
            var callback_sig = {
                callback: callback,
                timer: undefined
            };
            var track_id = _this._callbacks.push(callback_sig);
            var gen = _this._callbacks.age(track_id);
            callback_sig.timer = _this._time_out_closure(track_id, gen);
            _this.Send_Pack(0 /* _REQUEST */, remote_func_id, params, track_id, gen);
        };
        this.Emit = function (remote_event_id, params) {
            _this.Send_Pack(2 /* __EVENT */, remote_event_id, params);
        };
        this.Ready = function () {
            if (_this._is_ready < 0) {
                _this._is_ready = 0;
                _this.Send_Pack(3 /* __READY */, 0, [0, 1]);
                return true;
            }
            else {
                return false;
            }
        };
        this._sock = new FramedSocket(socket);
        this._sock.on("frame", this._sock_on_frame);
        this._sock.on("error", function (err) {
            if (_this._sock) {
                _this.emit("error", err);
            }
        });
        this._sock.on("close", function () {
            _this.emit("close");
        });
    }
    return RPCEndPoint;
})(events.EventEmitter);
exports.RPCEndPoint = RPCEndPoint;

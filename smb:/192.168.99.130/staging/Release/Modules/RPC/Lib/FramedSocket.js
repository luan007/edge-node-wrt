var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var FramedSocket = (function (_super) {
    __extends(FramedSocket, _super);
    function FramedSocket(socket) {
        var _this = this;
        _super.call(this);
        this.frag_read_len = 0;
        this.len_remain = 0;
        this.actual_data_length = 0;
        this.MAX_PACKET = 2048 * 1024;
        this._on_frame = function (frame) {
            try {
                _this.emit("frame", JSON.parse(frame.toString('utf8')));
            }
            catch (e) {
                _this.emit("data_error", new Error("bad packet"));
            }
        };
        this._on_error = function (err) {
            if (_this.socket) {
                _this.emit("error", err);
            }
        };
        this._on_data_error = function (err) {
            if (_this.socket) {
                _this.emit("data_error", err);
            }
        };
        this._on_close = function () {
            if (_this.socket) {
                _this.emit("close");
            }
        };
        this._sock_on_data = function (data) {
            var cursor = 0;
            while (cursor < data.length) {
                if (_this.len_remain == 0) {
                    if (_this.cur_pack != undefined) {
                        _this._on_frame(_this.cur_pack);
                        _this.cur_pack = undefined;
                    }
                    if (cursor + (4 - _this.frag_read_len) >= data.length || _this.frag_header != undefined) {
                        if (_this.frag_header == undefined) {
                            _this.frag_header = new Buffer(4);
                        }
                        var frag = data.copy(_this.frag_header, _this.frag_read_len, cursor, (cursor + (4 - _this.frag_read_len) >= data.length) ? (data.length) : (cursor + (4 - _this.frag_read_len)));
                        cursor += frag;
                        _this.frag_read_len += frag;
                        if (_this.frag_read_len == 4) {
                            _this.len_remain = _this.frag_header.readUInt32LE(0);
                            _this.frag_read_len = 0;
                            _this.frag_header = undefined;
                        }
                        else {
                            continue;
                        }
                    }
                    else {
                        _this.len_remain = data.readUInt32LE(cursor);
                        cursor += 4;
                    }
                    if (_this.len_remain > _this.MAX_PACKET) {
                        _this.cur_pack = undefined;
                        _this.actual_data_length = 0;
                        _this._on_data_error(new Error("Packet is too long : " + _this.len_remain));
                    }
                    else {
                        _this.cur_pack = new Buffer(_this.len_remain);
                        _this.actual_data_length = 0;
                    }
                    if (cursor >= data.length)
                        break;
                }
                var data_len_remain = data.length - cursor;
                var copy_length = data_len_remain < _this.len_remain ? data_len_remain : _this.len_remain;
                var copied;
                if (_this.cur_pack) {
                    copied = data.copy(_this.cur_pack, _this.actual_data_length, cursor, cursor + copy_length);
                }
                else {
                    copied = copy_length;
                }
                _this.actual_data_length += copied;
                cursor += copied;
                _this.len_remain -= copied;
            }
            if (_this.cur_pack != undefined && _this.len_remain == 0) {
                _this._on_frame(_this.cur_pack);
                _this.cur_pack = undefined;
            }
        };
        this.Bind = function (socket) {
            _this.socket = socket;
            _this.socket.on("data", _this._sock_on_data);
            _this.socket.on("error", _this._on_error);
            _this.socket.on("close", _this._on_close);
        };
        this.Unbind = function () {
            if (!_this.socket) {
                return;
            }
            _this.socket.destroy();
            _this.emit("close");
            _this.socket = undefined;
        };
        this.Send = function (object, encoding, callback) {
            if (_this.socket) {
                if (arguments.length == 2 && typeof arguments[1] == "function") {
                    callback = arguments[1];
                    encoding = undefined;
                }
                encoding = encoding || "utf8";
                var json = JSON.stringify(object);
                var bodyLen = Buffer.byteLength(json, encoding);
                if (bodyLen + 4 > _this.MAX_PACKET) {
                    return _this._on_data_error(new Error("Packet is too long : " + bodyLen + 4));
                }
                var data = new Buffer(4 + bodyLen);
                data.writeUInt32LE(bodyLen, 0);
                data.write(json, 4, bodyLen, encoding);
                _this.socket.write(data, callback);
            }
            else {
                throw new Error("Socket is undefined");
            }
        };
        if (socket) {
            this.Bind(socket);
        }
    }
    return FramedSocket;
})(events.EventEmitter);
module.exports = FramedSocket;

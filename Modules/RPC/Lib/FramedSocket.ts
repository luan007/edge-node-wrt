import net = require("net");
import events = require("events");

class FramedSocket extends events.EventEmitter {

    private frag_header: Buffer;
    private frag_read_len: number = 0;
    private len_remain = 0;
    private cur_pack: Buffer;
    private actual_data_length = 0;

    public MAX_PACKET: number = 2048 * 1024;
    public socket: net.Socket;

    private _on_frame = (frame: Buffer) => {
        try {
            this.emit("frame", JSON.parse(frame.toString('utf8')));
        } catch (e) {
            this.emit("data_error", new Error("bad packet"));
        }
    };

    private _on_error = (err: Error) => {
        if (this.socket) {
            this.emit("error", err);
        }
    };

    private _on_data_error = (err: Error) => {
        if (this.socket) {
            this.emit("data_error", err);
        }
    };

    private _on_close = () => {
        if (this.socket) {
            this.emit("close");
        }
    };

    constructor(socket?: net.Socket) {
        super();

        if (socket) {
            this.Bind(socket);
        }
    }

    private _sock_on_data = (data: Buffer) => {
        // log("Pack Received (Len) " + data.length);
        var cursor = 0;
        while (cursor < data.length) {
            if (this.len_remain == 0) {
                if (this.cur_pack != undefined) {
                    this._on_frame(this.cur_pack);
                    this.cur_pack = undefined;
                }
                if (cursor + (4 - this.frag_read_len) >= data.length ||
                    this.frag_header != undefined) {
                    if (this.frag_header == undefined) {
                        // log("Fragmented Header Detected");
                        this.frag_header = new Buffer(4);
                    }
                    var frag = data.copy(this.frag_header, this.frag_read_len, cursor,
                        (cursor + (4 - this.frag_read_len) >= data.length)
                        ? (data.length) : (cursor + (4 - this.frag_read_len)));

                    cursor += frag;
                    this.frag_read_len += frag;
                    if (this.frag_read_len == 4) {
                        this.len_remain = this.frag_header.readUInt32LE(0);
                        this.frag_read_len = 0;
                        this.frag_header = undefined;
                        //log("Fragmented Len = " + this.len_remain);
                    }
                    else {
                        continue;
                    }
                } else {
                    this.len_remain = data.readUInt32LE(cursor);
                    cursor += 4;
                }
                //log("Len:" + this.len_remain);
                if (this.len_remain > this.MAX_PACKET) {
                    this.cur_pack = undefined;
                    this.actual_data_length = 0;
                    this._on_data_error(new Error("Packet is too long : " + this.len_remain));
                }
                else {
                    this.cur_pack = new Buffer(this.len_remain);
                    this.actual_data_length = 0;
                }
                if (cursor >= data.length)
                    break;
            }
            var data_len_remain = data.length - cursor;
            var copy_length = data_len_remain < this.len_remain ? data_len_remain : this.len_remain;
            var copied;
            if (this.cur_pack) {
                copied = data.copy(this.cur_pack, this.actual_data_length, cursor, cursor + copy_length);
            }
            else {
                copied = copy_length;
            }
            this.actual_data_length += copied;
            cursor += copied;
            this.len_remain -= copied;
        }
        if (this.cur_pack != undefined && this.len_remain == 0) {
            //log("Frame: " + this.cur_pack.toString());
            this._on_frame(this.cur_pack);
            this.cur_pack = undefined;
        }
    }

    public Bind = (socket: net.Socket) => {
        this.socket = socket;
        this.socket.on("data", this._sock_on_data);
        this.socket.on("error", this._on_error);
        this.socket.on("close", this._on_close);
    };

    public Unbind = () => {
        if (!this.socket) {
            return;
        }
        this.socket.destroy();
        //this.socket.removeAllListeners();
        this.emit("close");
        this.socket = undefined;
        //this.removeAllListeners();
    };

    public Send = (object: any, encoding?: string, callback?: (err, result) => any) => {
        if (this.socket) {
            if (arguments.length == 2 && typeof arguments[1] == "function") {
                callback = arguments[1];
                encoding = undefined;
            }
            encoding = encoding || "utf8";
            var json = JSON.stringify(object); //UNSAFE
            var bodyLen = Buffer.byteLength(json, encoding);

            if (bodyLen + 4 > this.MAX_PACKET) {
                return this._on_data_error(new Error("Packet is too long : " + bodyLen + 4));
            }

            var data = new Buffer(4 + bodyLen);
            data.writeUInt32LE(bodyLen, 0);
            data.write(json, 4, bodyLen, encoding);
            //console.log("OUT");
            this.socket.write(data, callback);
        }
        else {
            throw new Error("Socket is undefined");
        }
    };
}


export = FramedSocket;


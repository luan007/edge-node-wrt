/**
 * Created by emerge on 15/4/15.
 */
import net = require("net");
import events = require("events");

class BinaryFramedSocket extends events.EventEmitter {


    public Id = UUID().toString('hex');

    private frag_header: Buffer;
    private frag_read_len: number = 0;
    private len_remain = 0;
    private cur_pack: Buffer;
    private cur_emitter: events.EventEmitter;
    private actual_data_length = 0;

    public  HEADER_LENGTH = 1 + 4 + 4 + 4; //msgtype, resourceid, trackid, ageid
    private header_length = 4 + this.HEADER_LENGTH; //framelength

    public MAX_PACKET: number = CONF.RPC_MAX_PACKET;
    public socket: net.Socket;

    public FrameOutput = true;

    private _on_frame = (header: Buffer, frame: Buffer) => {
        try {
            this.emit("frame", header, JSON.parse(frame.toString('utf8')));
        } catch (e) {
            error('_on_frame ->', header, frame.toString('utf8'));
            this.emit("error", new Error("bad packet"));
        }
    };

    private _on_header = (header: Buffer, emitter: events.EventEmitter) => {
        this.emit('header', header, emitter);
    };

    private _on_error = (err: Error) => {
        if (this.socket) {
            this.emit("error", err);
        }
    };

    private _on_data_error = (err: Error) => {
        if (this.socket) {
            this.emit("error", err);
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
        var cursor = 0;
        while (cursor < data.length) {
            if (this.len_remain == 0) {
                if(this.frag_read_len === 0) {
                    if (this.cur_emitter) {
                        this.cur_emitter.emit('end');
                        this.cur_emitter.removeAllListeners();
                        this.cur_emitter = undefined;
                    }
                    if (this.cur_pack != undefined) {
                        //console.log("Frame: " + this.cur_pack.length);
                        this._on_frame(this.frag_header, this.cur_pack);
                        this.cur_pack = undefined;
                    }
                    this.frag_header = new Buffer(this.header_length);
                }
                var frag = data.copy(this.frag_header, this.frag_read_len, cursor,
                    (cursor + (this.header_length - this.frag_read_len) >= data.length)
                        ? (data.length) : (cursor + (this.header_length - this.frag_read_len)));
                cursor += frag;
                this.frag_read_len += frag;

                if (this.frag_read_len == this.header_length) {
                    this.len_remain = this.frag_header.readInt32LE(0);
                    this.frag_read_len = 0;
                }
                else {
                    continue;
                }
                //else {
                //    this.len_remain = data.readInt32LE(cursor);
                //    cursor += this.header_length;
                //}
                //log("Len:" + this.len_remain);
                if (this.len_remain > this.MAX_PACKET) {
                    this.cur_pack = undefined;
                    this.actual_data_length = 0;
                    this._on_data_error(new Error("Packet is too long : " + this.len_remain));
                    this.cur_emitter = undefined;
                }
                else {
                    this.cur_emitter = new events.EventEmitter();
                    this._on_header(this.frag_header, this.cur_emitter);
                    if(this.FrameOutput) {
                        this.cur_pack = new Buffer(this.frag_header.readInt32LE(0) - this.HEADER_LENGTH);
                    }
                    this.actual_data_length = 0;
                    this.len_remain -=  this.HEADER_LENGTH;
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
            var slice = data.slice(cursor, cursor + copy_length); //TODO: test if this works
            this.cur_emitter.emit('data', slice);

            this.actual_data_length += copied;
            cursor += copied;
            this.len_remain -= copied;
        }
        if (this.len_remain == 0) {
            if (this.cur_emitter) {
                this.cur_emitter.emit('end');
                this.cur_emitter.removeAllListeners();
                this.cur_emitter = undefined;
            }
            if(this.FrameOutput && this.cur_pack != undefined) {
                this._on_frame(this.frag_header, this.cur_pack);
                this.cur_pack = undefined;
            }
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

    public Send = (header:Buffer, buffer: string | Buffer, callback?: (err, result) => any) => {
        if (this.socket) {
            var bodyLen = header.length + ((typeof buffer === 'string') ? Buffer.byteLength(<string>buffer, 'utf8') : buffer.length);
            if (bodyLen + 4 > this.MAX_PACKET) {
                return this._on_data_error(new Error("Packet is too long : " + bodyLen + 4));
            }
            var lenbuf = new Buffer(4);
            lenbuf.writeInt32LE(bodyLen, 0);
            this.socket.write(lenbuf);
            this.socket.write(header);
            this.socket.write(<Buffer>buffer, callback);
        }
        else {
            throw new Error("Socket is undefined");
        }
    };

    public RawWrite = (buf: Buffer, callback?: (err, result) => any) => {
        if (this.socket) {
            this.socket.write(buf, callback);
        }
        else {
            throw new Error("Socket is undefined");
        }
    };

}


export = BinaryFramedSocket;


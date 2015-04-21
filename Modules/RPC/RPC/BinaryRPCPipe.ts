import net = require("net");
import events = require("events");
import BinaryFramedSocket = require("../Lib/BinaryFramedSocket");
import ExArray = require("../Lib/ExtendedArray");
import APIError = require("../Lib/APIError");
import Definition = require('./Definition');
import msgpack = require('msgpack');
import Frap = require('frap');

export class BinaryRPCPipe extends events.EventEmitter {

    //private _sock: BinaryFramedSocket;
    private _sock;

    private static _callbacks = new ExArray<{
        callback: Function;
        timer: number;
        peer: BinaryRPCPipe;
        trackid;
        ageid;
    }>(4096);

    //private _eventCallbacks:{[key: number]: Array<Function>} = {};

    public TimeOut:number = 10 * 60 * 1000;

    private _call_handler:Function;

    private _event_handler:Function;

    private _is_ready = -1;

    constructor(socket:net.Socket) {
        super();
        //this._sock = new BinaryFramedSocket(socket);
        this._sock = new Frap(socket, {emit: 'basic'});
        this._sock['Id'] = UUID().toString('hex');
        //this._sock.FrameOutput = false;
        this._sock.on('header', this._parse_header);
        //this._sock.on('data', this._find_header);
        //this._sock.on("part", this._find_header);
        this._sock.on("error", (err) => {
            if (this._sock) {
                this.emit("error", err);
            }
        });
        this._sock.on("close", () => {
            this.emit("close");
        });
    }

    private _parse_header = (frameLen) => {
        //trace('1. Frame Length', frameLen);
        var rstream = this._sock.createReadFrameStream(frameLen);
        rstream.pause();

        this._find_header(rstream, frameLen);
    }

    private _find_header = (rstream, framelen) => {
        //trace('1. _find_header', framelen);
        var headerLength = 1 + 4 + 4 + 4;
        var headerBuffer = new Buffer(headerLength);
        var headerPos = 0;
        var beforeStart:Buffer = undefined;
        rstream.on('data', (d:Buffer) => {
            rstream.pause();
            rstream.removeAllListeners('data');
            //fatal('1.2 on data ', d, '\n buffer length', d.length);
            var cursor = d.copy(headerBuffer, headerPos, 0, d.length >= (headerLength - headerPos) ? (headerLength - headerPos) : d.length);
            headerPos += cursor;
            if (headerPos === headerLength) {
                rstream.pause();
                beforeStart = d.slice(cursor);

                //warn('2. stream stopped.', headerBuffer, '\n before length', beforeStart.length);

                //emit old header event
                this._sock_on_header(headerBuffer, rstream, beforeStart, framelen);
            }
        });
        rstream.resume();
    };

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
        //this._sock.Unbind();
        this._sock.destroy();
        this._sock = undefined;
    };

    public Reply(funcId, trackid, age, err, res) {
        var args = [];
        if (err) {
            args[0] = Definition.ConvertError(err);
            if (res) args.push(res);
        }
        else
            args = [undefined, res];
        this.Send_Pack(Definition.RPC_Message_Type.__RESPONSE, funcId, args, trackid, age);
    }

    private _sock_on_header = (header:Buffer, frame, firstPack:Buffer, frameLength) => {
        var type = <Definition.RPC_Message_Type>header.readInt8(0);
        var resourceid = header.readInt32LE(1);
        var trackid = header.readInt32LE(5);
        var ageid = header.readInt32LE(9);
        var rewire_target:BinaryRPCPipe = undefined;
        //trace("3. RPC_I < ", type, resourceid, trackid, ageid);

        switch (type) {
            case Definition.RPC_Message_Type.__REQUEST:
                rewire_target = this._on_remote_call(resourceid, trackid, ageid, frame);
                this.ForwardCall(rewire_target, header, frame, firstPack, frameLength);
                break;
            case Definition.RPC_Message_Type.__RESPONSE:
                this._on_remote_reply(header, frame, trackid, ageid, firstPack, frameLength);
                break;
            case Definition.RPC_Message_Type.__EVENT:
                rewire_target = this._on_emit_event(resourceid);
                this.ForwardEvent(<any>rewire_target, header, frame, firstPack, frameLength);
                break;
            case Definition.RPC_Message_Type.__READY:
                //do nothing
                //this._on_ready(); //dummy
                break;
        }
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
        //this._sock.Send(header, data);
    };

    private _on_ready = () => {
        //not implemented
        return undefined;
    };

    private _on_remote_call = (funcId, trackid, age, frame) => {
        if (this._call_handler) {
            return this._call_handler(funcId, trackid, age, frame);
        }
        return undefined;
    };

    private _on_remote_reply = (header, frame, trackid, age, firstPack, frameLength) => {
        trace('4. ON REMOTE REPLY!', trackid, age);
        if (BinaryRPCPipe._callbacks.age(trackid) == age) {
            trace('4.1 ON REMOTE REPLY .age(trackid) == age', trackid, age);
            var _cb = BinaryRPCPipe._callbacks.pop(trackid);
            if (_cb && _cb.callback) {
                trace('4.2 ON REMOTE REPLY _cb.callback', trackid, age);
                this.ForwardReply(_cb.peer, header, frame, _cb.trackid, _cb.ageid, firstPack, frameLength);
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
            if (BinaryRPCPipe._callbacks.age(track_id) == gen) {
                var obj = BinaryRPCPipe._callbacks.pop(track_id);
                if (obj && obj.callback) {
                    obj.callback(new Error("Proxy Time-out"), undefined);
                }
            }
            clearTimeout(timer);
        }, this.TimeOut);
        return timer;
    };

    private ForwardReply = (peer:BinaryRPCPipe, header, frame, originalTrack, originalAge, firstPack, frameLength) => {
        if (!(peer && peer._sock && this._sock)) return;
        var type = <Definition.RPC_Message_Type>header.readInt8(0);
        var resourceid = header.readInt32LE(1);
        var trackid = header.readInt32LE(5);
        var ageid = header.readInt32LE(9);
        //MASQR
        header.writeInt32LE(originalTrack, 5);
        header.writeInt32LE(originalAge, 9);

        //var newHeader = new Buffer(4 + 1 + 4 + 4 + 4);
        //newHeader.writeInt32LE(frameLength + 4, 0);
        //newHeader.writeInt8(type, 4);
        //newHeader.writeInt32LE(resourceid, 5);
        //newHeader.writeInt32LE(trackid, 9);
        //newHeader.writeInt32LE(ageid, 13);

        var bufs = [];


        intoQueue(peer._sock['Id'], (sent) => {

            //console.log('creating raw');
            var raw = peer._sock.createWriteFrameStream(frameLength);

            //console.log('[', process.pid, '] do forward reply for ', peer._sock['Id']);
            //peer.RawWrite(header);
            //bufs.push(header);
            //if (firstPack)
            //    raw.write(firstPack);
            ////bufs.push(firstPack);
            ////peer.RawWrite(firstPack);
            //frame.pipe(raw);
            ////frame.on('data', function (buf) {
            ////    //bufs.push(buf);
            ////    //peer.RawWrite(buf);
            ////    raw.write(buf);
            ////});
            //frame.on('end', ()=>{
            //    raw.destroy();
            //});
            //raw.on('close', ()=>{
            //    this._sock.resume();
            //    sent();
            //});
            //frame.resume();


            frame.once('end', ()=> {
                this._sock.pause()
            })

            frame.once('close', ()=> {
                //wstream.destroySoon() //strangely faster WTF?!?
                raw.destroy()
            })

            raw.once('close', ()=> {
                console.log('raw closed');
                this._sock.resume();
                sent();
            })

            raw.write(header);
            raw.write(firstPack);
            frame.pipe(raw)
        }, ()=> {
            //    peer._sock.sendFrame.apply(peer._sock, bufs);
            console.log('[', process.pid, '] DONE forward reply for ', peer._sock['Id']);
        });
    };

    private ForwardCall = (peer:BinaryRPCPipe, header, frame, firstPack, frameLength) => {
        if (!(peer && peer._sock && this._sock)) return;
        var type = header.readInt8(0);
        var resourceid = header.readInt32LE(1);
        var trackid = header.readInt32LE(5);
        var ageid = header.readInt32LE(9);
        var callback = (err) => {
            //console.log('proxy timeout callback ', trackid, ageid);
            return this.Send_Pack(Definition.RPC_Message_Type.__RESPONSE, resourceid, [Definition.ConvertError(err)], trackid, ageid);
        };
        var callback_sig = {
            callback: callback,
            timer: undefined,
            trackid: trackid, //original
            ageid: ageid, //original
            peer: this
        };
        var track_id = BinaryRPCPipe._callbacks.push(callback_sig);
        var gen = BinaryRPCPipe._callbacks.age(track_id);
        callback_sig.timer = this._time_out_closure(track_id, gen);

        //MASQR
        header.writeInt32LE(track_id, 5);
        header.writeInt32LE(gen, 9);

        //var newHeader = new Buffer(4 + 1 + 4 + 4 + 4);
        //newHeader.writeInt32LE(frameLength + 4, 0);
        //newHeader.writeInt8(type, 4);
        //newHeader.writeInt32LE(resourceid, 5);
        //newHeader.writeInt32LE(trackid, 9);
        //newHeader.writeInt32LE(ageid, 13);

        //var bufs = [];

        trace('before intoQueue [', process.pid, '] ');

        intoQueue(peer._sock['Id'], (sent) => {

            //console.log('creating raw');9
            var raw = peer._sock.createWriteFrameStream(frameLength);

            //console.log('[', process.pid, '] do forward call for ', peer._sock['Id']);
            //peer.RawWrite(header);
            //bufs.push(header);
            //if (firstPack)
            //    raw.write(firstPack);
            ////bufs.push(firstPack);
            ////peer.RawWrite(firstPack);
            //frame.pipe(raw);
            ////frame.on('data', function (buf) {
            ////    //bufs.push(buf);
            ////    //peer.RawWrite(buf);
            ////    raw.write(buf);
            ////});
            //frame.on('end', ()=>{
            //    raw.destroy();
            //});
            //raw.on('close', ()=>{
            //    this._sock.resume();
            //    sent();
            //});
            //frame.resume();


            frame.once('end', ()=> {
                this._sock.pause()
            })

            frame.once('close', ()=> {
                //wstream.destroySoon() //strangely faster WTF?!?
                raw.destroy();
            })

            raw.once('close', ()=> {
                console.log('raw closed');
                this._sock.resume();
                sent();
            })

            raw.write(header);
            raw.write(firstPack);
            frame.pipe(raw)
        }, ()=> {
            //    peer._sock.sendFrame.apply(peer._sock, bufs);
            console.log('[', process.pid, '] DONE forward call for ', peer._sock['Id']);
        });
    };

    private RawWrite = (data, callback?:(err, result) => any) => {
        if (this._sock)
            this._sock.write(data, callback);
    };

    private ForwardEvent = (peer:BinaryRPCPipe[], header, frame, firstPack, frameLength) => {
        if (!(this._sock && peer)) return;
        var type = header.readInt8(0);
        var resourceid = header.readInt32LE(1);
        var trackid = header.readInt32LE(5);
        var ageid = header.readInt32LE(9);

        //var newHeader = new Buffer(4 + 1 + 4 + 4 + 4);
        //newHeader.writeInt32LE(frameLength + 4, 0);
        //newHeader.writeInt8(type, 4);
        //newHeader.writeInt32LE(resourceid, 5);
        //newHeader.writeInt32LE(trackid, 9);
        //newHeader.writeInt32LE(ageid, 13);

        for (var i = 0; i < peer.length; i++) {
            if (!peer[i]._sock) continue;
            ((p)=> {
                intoQueue(p._sock.Id, (sent) => {
                    p.RawWrite(header);
                    if (firstPack)
                        p.RawWrite(firstPack);
                    frame.on('data', function (buf) {
                        p.RawWrite(buf);
                    });
                    frame.on('end', sent);
                    frame.resume();
                }, ()=> {
                });
            })(peer[i]);
        }
    };
}

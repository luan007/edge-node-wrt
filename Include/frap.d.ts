import Stream = require("stream");
import events = require("events");
import EventEmitter = events.EventEmitter;

interface Frap extends FrapReader {
    destroy();
    destroySoon();
    pipe(dst);
    sendFrame
    sendFrame();
    setSrcDrainWatcher();
    sendHeader(framelen);
    sendPart(buf);
    createWriteFrameStream(framelen):WriteFrameStream;
    createReadFrameStream(framelen):ReadFrameStream;
}

interface FrapReader extends Stream {
    parse(buf);
    _submit(event, framelen, pbuf, pos);
    dispatchOne(event, framelen, pbuf, pos);
    dispatch();
    setEncoding(encoding);
    write(buf, enc);
    pause();
    resume();

    static listenerCount(emitter:EventEmitter, event:string): number;
    addListener(event:string, listener:Function): EventEmitter;
    on(event:string, listener:Function): EventEmitter;
    once(event:string, listener:Function): EventEmitter;
    removeListener(event:string, listener:Function): EventEmitter;
    removeAllListeners(event?:string): EventEmitter;
    setMaxListeners(n:number): void;
    listeners(event:string): Function[];
    emit(event:string, ...args:any[]): boolean;
}

interface ReadFrameStream extends Stream {
    constructor(frap, framelen);
    setEncoding(encoding);
    pause();
    resume();
    destroy();
}

interface WriteFrameStream extends Stream {
    constructor(frap, framelen);
    write(buf, enc);
    end(buf, enc);
    destroy();
    destroySoon();
}

declare module "frap" {
    export = Frap;
}

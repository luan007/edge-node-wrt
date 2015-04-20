declare module "frap" {
    import Stream = require("Stream");

    export class Frap extends FrapReader{
        destroy();
        destroySoon();
        pipe(dst);sendFrame
        sendFrame();
        setSrcDrainWatcher();
        sendHeader(framelen);
        sendPart(buf);
        createWriteFrameStream(framelen) : WriteFrameStream;
        createReadFrameStream(framelen) : ReadFrameStream;
    }

    export class FrapReader extends Stream{
        parse(buf);
        _submit(event, framelen, pbuf, pos);
        dispatchOne(event, framelen, pbuf, pos);
        dispatch();
        setEncoding (encoding);
        write (buf, enc);
        pause();
        resume();
    }

    export class ReadFrameStream extends Stream{
        constructor(frap, framelen);
        setEncoding (encoding);
        pause();
        resume();
        destroy();
    }

    export class WriteFrameStream extends Stream{
        constructor(frap, framelen);
        write (buf, enc);
        end(buf, enc);
        destroy();
        destroySoon();
    }
}
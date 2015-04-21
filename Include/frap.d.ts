///<reference path="node.d.ts"/>
declare module 'frap' {
    import stream = require("stream");
    import net = require('net');

    interface Frap extends FrapReader {
        new (sk, opts?): Frap;
        destroy();
        destroySoon();
        /**
         * sendFrame(buf0, buf1, ..., bufN)   //send a list of bufs
         */
        sendFrame(...args);
        setSrcDrainWatcher();
        sendHeader(framelen);
        sendPart(buf);
        createWriteFrameStream(framelen): WriteFrameStream;
        createReadFrameStream(framelen): ReadFrameStream;

        sk: net.Socket;
    }

    interface FrapReader extends stream.Stream {
        parse(buf);
        _submit(event, framelen, pbuf, pos);
        dispatchOne(event, framelen, pbuf, pos);
        dispatch();
        setEncoding(encoding);
        write(buf, enc?);
        pause();
        resume();
    }

    interface ReadFrameStream extends stream.Stream {
        setEncoding(encoding);
        pause();
        resume();
        destroy();
    }

    interface WriteFrameStream extends stream.Stream {
        write(buf, enc);
        end(buf, enc);
        destroy();
        destroySoon();
    }

    var _frap: Frap;
    export = _frap;
}
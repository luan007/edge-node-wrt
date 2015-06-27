var fs = require('fs');
var express = require('express');
var app = express();
var main = express();
var http = require('http').Server(main);
var io = require('socket.io')(http);
var mdns = require('mdns');
var getmac = require('getmac');
var port = 15555;
var mac = "";
var name = 'crap2';

var sockets = {};

getmac.getMac(function (err, _m) {
    mac = _m;
    if (err) throw err;
    var model = 'AppleTV2,1';
    var txt = {
        deviceid: mac.toUpperCase(), // MAC address
        features: 0x39f7,       // supported features
        model: model,                // device model
        srcvers: '130.14',        // server version
    };

    console.log('Starting server with name %s...', name);
    mdns
        .createAdvertisement(mdns.tcp('airplay'), port, {
            name: name,
            txtRecord: txt
        }).start();

    var txtRecord = {
        txtvers: '1',    // TXT record version 1
        ch: '2',         // audio channels: stereo
        cn: '0,1,2,3',   // audio codecs
        et: '0,3,5',     // supported encryption types
        md: '0,1,2',     // supported metadata types
        pw: 'false',     // does the speaker require a password?
        sr: '44100',     // audio sample rate: 44100 Hz
        ss: '16',        // audio sample size: 16-bit
        tp: 'UDP',       // supported transport: TCP or UDP
        vs: '130.14', // server version
        am: model        // device model
    };

    console.log('Starting server with name %s...', name);
    mdns
        .createAdvertisement(mdns.tcp('raop'), port, {
            name: mac.toUpperCase().replace(/:/g, '') + '@' + name,
            txtRecord: txtRecord
        })
        .start();
});

app.use(function(req, res, next){
    console.log(req.path);
    next();
});

app.get('/server-info', function(req, res){
    var str = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"> <dict> <key>deviceid</key> <string>'+mac+'</string> <key>features</key> <integer>14839</integer> <key>model</key> <string>AppleTV2,1</string> <key>protovers</key> <string>1.0</string> <key>srcvers</key> <string>130.14</string> </dict></plist>';
    res.contentType("text/x-apple-plist+xml");
    res.send(200, str);
});

var session = "";

app.put('/photo', function(req, res){
    var action = req.header('X-Apple-AssetAction');
    var key = req.header('X-Apple-AssetKey');
    session = req.header('X-Apple-Session-ID');
    console.log('session', session);
    if(action === 'displayCached'){
        console.log('DISPLAY CACHED IMAGE! - ' + key);
    } else {
        var stream = fs.createWriteStream('./laji/' + key + ".jpg");
        req.pipe(stream);
    }
    req.on('end', function(){
        console.log('req ended');
        if(action === 'cacheOnly'){
            return;
        }
        fs.readFile('./laji/' + key + ".jpg", function(err, buf){
            for(var i in sockets){
                sockets[i].emit('image', { image: true, buffer: buf.toString('base64')});
            }
        });
    });
    res.send(200);
});

app.post('/stop', function(req, res){
    var addr = req.connection.remoteAddress;
    console.log(addr);
    res.send(200);
});

app.post('/play', function(req, res){
    var addr = req.connection.remoteAddress;
    console.log('PLAY ', req.headers);
    var dt = "";
    req.on('data', function(d){
        dt += d.toString();
    }).on('end', function(){
        var i = dt.indexOf("http");
        var j = dt.lastIndexOf("MOV");
        var str = dt.substring(i, j);
        for(var t in sockets){
            sockets[t].emit('video', str + "MOV" );
        }
        console.log(str);
    });
    res.send(200);
});

app.post('/reverse', function(req, res){
    console.log("reversed!");
});

app.use(function(req, res){
    //console.log('uncaught', req.path);
    res.send(200);
});

app.listen(port);
io.on('connection', function(socket){
    var key = Math.random();
    sockets[key] = socket;
    socket.on('end', function(){
        delete sockets[key];
    });
});


main.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

http.listen(8080);
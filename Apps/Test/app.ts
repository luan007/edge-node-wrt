/// <reference path="./global.d.ts" />


//SERVER = Server

import express = require("express");
import net = require("net");
import fs = require("fs");
import cp = require("child_process");
console.log("Loading Test Application");
var app = express();
var resarr = [];
app.get("/", (req, res) => {
	res.sendfile("/index.html");
});

app.get("/ao", (req, res)=>{
    try{
        cp.execFile("/phantomjs", (err)=>{
            console.log("ZHAZHA", err, "aloha");
        });
    }catch(e){
        console.log(e);
        console.log("trytry");
    }
    res.json({a: "LAJI"});
});

app.get("/laji", (req, res: any) => {
   var d = resarr.push(res);
   res.on('close', function(){
       resarr[d] = undefined;
   }).on('end', function(){
       resarr[d] = undefined;
   });
});

function burst(d){
    for(var i = 0; i < resarr.length; i++){
        if(resarr[i]) resarr[i].write(d);
    }
}

Server.addListener('request', app);

var lame = require('lame');
 
var prev = undefined;
var sock;
var curlaji = undefined;
API.RegisterEvent(["Stat.set", "Stat.del"], console.log);
API.Stat.on('set', function(key, v, old, n) {
    if(key === "STREAMING.Airplay"){
      var i = n.StreamUID;
      if(prev !== i){
        prev = i;
        if(!i) {
            if(sock) { 
                try{
                    curlaji = undefined;
                    sock.removeAllListeners();
                    sock.destroy();     
                } catch(e) {
                    console.log(e);
                }    
            }
            sock = undefined;
            return console.log("EMPTY STREAM");
        }
        console.log(i);
        
        
        console.log("/Share/Resource/Streaming/Airplay/" + i);
        console.log(fs.readdirSync("/Share/"));
        sock = net.connect("/Share/Resource/Streaming/Airplay/" + i);
        
        // create the Encoder instance 
        var encoder = new lame.Encoder({
            // input 
            channels: 2,        // 2 channels (left and right) 
            bitDepth: 16,       // 16-bit samples 
            sampleRate: 44100,  // 44,100 Hz sample rate 
           
            // output 
            bitRate: 128,
            outSampleRate: 22050,
            mode: lame.STEREO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO 
        });
        console.log("AIR STREAM GET **************");
        sock.pipe(encoder);
        encoder.on('data', burst);
      }
    }
});
// 
// // raw PCM data from stdin gets piped into the encoder 
// process.stdin.pipe(encoder);
//  
// // the generated MP3 file gets piped to stdout 
// encoder.pipe(process.stdout);

// // 
//     
// API.Message.RawQuery(
//     {
//         source: "TestApp"
//     },  (err, result)=>{
//         console.log("Sent by Test App: ");
//         console.log(result);
//     });
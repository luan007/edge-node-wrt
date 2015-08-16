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

app.get("/wps", (req, res) => {
    API.Edge.Wireless.WPS((err)=>{
        console.log(err);
    });
	res.json({ done: "true" });
});


app.get("/call", (req, res) => {
    API.Driver.Invoke("App_Launcher:HFP", "40231ea469e64fa1b5262d96ccaed235", "dial", {
        phoneNo: "15210691899"
    }, (err, result)=>{
        res.json({ err: err, result: result });
    });
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
            outSampleRate: 44100 / 2,
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

// API.Thirdparty.Primary("test", "9a917c50df924e55bba9c8822bfc8491", {
//     Test: 1
// }, (err)=>{
//     console.log("yeah");
//         
//     API.Thirdparty.Primary("test", "9a917c50df924e55bba9c8822bfc8491", console.log);
//         
// });

// function __toControl(R, G, B, L) {
//    var str = R + "," + G + "," + B + "," + L + ",";
//    for (var i = str.length; i < 18; i++) {
//        str += ",";
//    }
//    return new Buffer(str);
// }
// 
//    console.log(">>> Starting btle invocation.");
// 
//    var address = "B4:99:4C:76:02:DE";
//    API.Edge.Wireless.BTLE.Connect(address, (err)=>{
//        if(err) return console.log(err);
//        //var effect = new Buffer("TE");
//        //API.Edge.Wireless.BTLE.Write(address, "fffc", effect, (err)=>{
//        console.log(">>> After set TE... turn off");
// 
//        API.Edge.Wireless.BTLE.Write(address, "fff1", __toControl(100, 100, 100, 0), (err2)=>{
//            if(err2) return console.log(err2);
// 
//            console.log(">>> After set TE... turn on");
//            //API.Edge.Wireless.BTLE.Write(address, "fff1", __toControl(100, 100, 100, 100), (err3)=>{
//            //    if(err3) return console.log(err3);
//            //
//            //    console.log("After set TE... DONE!");
//            //});
//            API.Edge.Wireless.BTLE.Disconnect(address, (err3)=>{
//                if(err3) return console.log(err3);
//            })
//        });
//    });
// 
// 


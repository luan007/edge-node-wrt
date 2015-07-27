/// <reference path="./global.d.ts" />


//SERVER = Server

import express = require("express");

console.log("Loading Test Application");

//function __toControl(R, G, B, L) {
//    var str = R + "," + G + "," + B + "," + L + ",";
//    for (var i = str.length; i < 18; i++) {
//        str += ",";
//    }
//    return new Buffer(str);
//}

//setTimeout(()=>{
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
//}, 60 * 1000);
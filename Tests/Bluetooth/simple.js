var noble = require("noble");
var dev;

function toControl (R, G, B, L){
    var str = R + "," + G + "," + B + "," + L +",";
    for(var i = str.length; i< 18; i++){
        str += ",";
    }
    return new Buffer(str);
}


var addr = "b4994c7602de";
noble.on("discover", function(perf){
    if(perf.uuid == addr){
        console.log("found");
        perf.on("connect", function(){
            console.log("!");
            dev = perf;
            go(0,0,0,0);
            
            dev.writeHandle(0x37, new Buffer("TE"), function(){
                console.log("MODE SET");
            });
            perf.on("close", function(){
                console.log("Closed");
            });
        });
        perf.connect();
    }
});
noble.startScanning();

function go(r,g,b,l){
    r = parseInt(Math.min(Math.max(0, Math.floor(r)), 255)) + "";
    g = parseInt(Math.min(Math.max(0, Math.floor(g)), 255)) + "";
    b = parseInt(Math.min(Math.max(0, Math.floor(b)), 255)) + "";
    l = parseInt(Math.min(Math.max(0, Math.floor(l)), 100)) + "";
    if(dev){
        dev.writeHandle(0x12, toControl(r,g,b,l), function(err, result){
        });
    }
}


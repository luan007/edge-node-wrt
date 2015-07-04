var conversion = require("phantom-html-to-pdf")();
var http = require('http');
var fs = require('fs');

function crawl(url, cb){
    http.get(url, function(res) {
        console.log("Got response: " + res.statusCode);
        var bufs = [];
        res.on('data', function(data){
            bufs.push(data);
        });
        res.on('end', function(){
            var buf = Buffer.concat(bufs);
            var html = buf.toString();
            return cb(null, html);
        });
        res.on('error', function(err){
            return cb('res err:' + err);
        });
    }).on('error', function(err) {
        return cb('get err:' + err);
    });
}

function toPDF(html, filePath){
    conversion({ html: html }, function(err, pdf) {
        if(err) return console.log(err);
        console.log('pages ', pdf.numberOfPages);
        var wstream = fs.createWriteStream(filePath);
        pdf.stream.pipe(wstream);
        pdf.stream.on('end', function(){
            console.log('wrote finished');
            process.exit(0);
        });
        pdf.stream.on('error', function(err){
            console.log('wrote error', err);
            process.exit(0);
        });
    });
}

if(process.argv.length < 3)
    return console.log('please supply the uri');

var uri	 = process.argv[2];
crawl(uri, function(err, html){
    if(err) return console.log(err);
    toPDF(html, 'out.pdf');
});
var conversion = require("phantom-html-to-pdf")();
var fs = require('fs');
var request = require('request');

function crawl(url, cb){
    var opts = {};
    opts.url = url;
    opts.method = 'GET';
    opts.gzip = opts.gzip || true;
    opts.headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
    };
    request(opts, function (err, response, html) {
        return cb(err, html);
    }).on('data', function (data) {
        console.log('received data', data.length);
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
return crawl(uri, function(err, html){
    if(err) return console.log(err);
    return toPDF(html, 'out.pdf');
});
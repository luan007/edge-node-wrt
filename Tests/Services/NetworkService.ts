import http = require('http');
var results = '';
var done = false;

export function Crawl(host, cb){
    //if(done) cb(null, results);
    //else {
        var results = '';
        var options = {
            port: 80,
            hostname: host,
            method: 'GET',
            path: '/'
        };
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                results = results + chunk;
            });
            res.on('end', function () {
                done = true;
                cb(undefined, results);
            });
        });
        req.on('error', function (e) {
            cb(e, undefined);
        });
        req.end();
    //}
}
var request = require('request');

function crawl(url, cb){
    var opts = {};
    opts.url = url;
    opts.method = 'HEAD';
    opts.gzip = opts.gzip || true;
    opts.headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
    };
    request(opts, function (err, response) {
        return cb(err, response);
    }).on('data', function (data) {
        console.log('received data', data.length);
    });
}

crawl(process.argv[2], function(err, response){
    console.log(JSON.stringify(response));
});
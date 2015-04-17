var exp = new RegExp('<a[^>]+>.*?</a>', 'gmi');

export function ExtractLinks(html, cb) {
    var res = html.match(exp);
    if(!res) res = [];
    //cb(undefined, null);
    cb(undefined, res.join());
}
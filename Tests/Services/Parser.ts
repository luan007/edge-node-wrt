var exp = new RegExp('<a[^>]+>.*?</a>', 'gmi');

export function ExtractLinks(html, cb) {
    var res = html.match(exp);
    cb(undefined, res.join());
}
var mmm = require('mmmagic'),
    Magic = mmm.Magic;

var magic = new Magic(mmm.MAGIC_MIME_TYPE);
magic.detectFile(process.argv[2], function(err, result) {
    if(err) return console.log(err);
    console.log(result);
});

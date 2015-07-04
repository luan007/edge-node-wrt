var webshot = require('webshot');

webshot('baidu.com', 'baidu.png', function(err) {
    // screenshot now saved to flickr.jpeg
    if(err) console.log(err);
});
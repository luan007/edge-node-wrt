var domain = require('domain').create();
domain.on('error', function (err) {
    error(err);
});

domain.run(function () {

});
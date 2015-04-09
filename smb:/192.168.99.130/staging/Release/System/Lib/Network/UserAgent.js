var useragent = require('useragent');
function parseUA(req) {
    return useragent.lookup(req.headers["user-agent"]);
}
exports.parseUA = parseUA;
function Initialize() {
    global.parseUA = parseUA;
    global.UAParser = useragent;
}
exports.Initialize = Initialize;

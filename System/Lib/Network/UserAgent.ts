var useragent: any = require('useragent');

export function parseUA(req) {
    return useragent.lookup(req.headers["user-agent"]);
}

export function Initialize() {
    global.parseUA = parseUA;
    global.UAParser = useragent;
}
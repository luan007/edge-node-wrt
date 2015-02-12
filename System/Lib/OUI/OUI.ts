var level;
var db;

export function OUI_Find(mac: string, callback) {
    db.get(mac.toLowerCase(), {}, (err, data) => {
        callback(err, data);
    });
}

export function Initialize() {
    level = require("level");
    db = level("./Lib/OUI/OUI");
    db.open();
    global.OUI_Find = OUI_Find;
}
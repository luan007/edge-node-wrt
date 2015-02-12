import fs = require("fs");

export function Initialize() {
    
    if (process.platform === "win32") {
    }
    else {
        if (fs.existsSync("/tmp/fdsock")) {
            trace("Swipin' /tmp/fdsock".bold);
            var stat: fs.Stats;
            if ((stat = fs.statSync("/tmp/fdsock")).isDirectory()) {
            }
            else {
                fs.unlinkSync("/tmp/fdsock");
                fs.mkdirSync("/tmp/fdsock");
                //good
            }
        }
        else {
            fs.mkdirSync("/tmp/fdsock");
            trace("Creatin' /tmp/fdsock".bold);
        }
        var old = fs.readdirSync("/tmp/fdsock/");
        for (var i = 0; i < old.length; i++) {
            try {
                fs.unlinkSync("/tmp/fdsock/" + old[i]);
            } catch (e) { }
        }
    }
    global.getSock = getSock;
    global.clearSock = clearSock;
}

function clearSock(id, root?) {
    if (!root) {
        if (process.platform === "win32") {
            // do nothing
        } else {
            try {
                fs.unlinkSync("/tmp/fdsock/" + id + ".t");
            } catch (e) {

            }
        }
    }
    else {
        if (process.platform === "win32") {
            // do nothing
        } else {
            try {
                fs.unlinkSync(root + "/" + id + ".t");
            } catch (e) {

            }
        }
    }
}

function getSock(id, root?): string {

    if (process.platform === "win32") {
        return "\\\\.\\pipe\\" + id;
    } else {
        if (!root) {
            return "/tmp/fdsock/" + id + ".t";
        }
        else {
            return root + "/" + id + ".t";
        }
    }
}


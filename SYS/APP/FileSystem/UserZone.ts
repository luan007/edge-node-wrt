import smbd = require("../../Common/Native/smbd");
import obex = require("../../Common/Native/obex");
import ssdp = require("../../Common/Native/ssdp");
import fs = require('fs');
import path = require('path');

export var Obexd = new obex.Obexpushd();

export var Samba = new smbd.SmbDaemon(new smbd.SmbConfig());

export function Initialize(cb) {
    //Check if the folder exists..
    trace("Init..");
    //TODO: GET THIS FIXED
    //EdgeFS.Init(process.env.GUARD_PATH);
    if (!fs.existsSync(CONF.USER_DATA_PATH)) {
        info("Creating User Data Dir ..");
        fs.mkdirSync(CONF.USER_DATA_PATH);
    }

    trace("Preparing User Root..");
    async.series([
        exec.bind(null, "chown", "nobody", "-R", CONF.USER_DATA_PATH),
        exec.bind(null, "chmod", "777", CONF.USER_DATA_PATH),
        mkStruct.bind(null, CONF.USER_DATA_PATH, {
            "FileTransfer": {}
        }, true)
    ], cb);

    var transfer_folder = path.join(CONF.USER_DATA_PATH, "FileTransfer");
    
    Samba.Config.Folders["Shared"] = {
        Guest_Ok: true,
        ReadOnly: false,
        Path: CONF.USER_DATA_PATH,
        Browseable: true,
        Comment: "Shared",
        Guest_Account: "nobody"
    };

    Obexd.on("connection",(file: obex.ObexpushObject) => {
        //TODO: Split Users
        var curLen = 0;
        var n = file.Properties.Name;
        var c = n;
        var co = 0;
        while (fs.existsSync(path.join(transfer_folder, c))) {
            c = n.split(".")[0] + "(" + (co++) + ")" + n.substr(n.split(".")[0].length);
        }
        var f = path.join(transfer_folder, c);
        trace(f);
        var stream = fs.createWriteStream(f);
        file.on("data",(buf) => {
            curLen += buf.length;
            stream.write(buf);
        });
        file.on("end",() => {
            stream.end();
            stream.close();
            if (curLen != file.Properties.Length) {
                fs.unlinkSync(f);
                warn("Broken file / Canceled!");
            }
        });
        file.on("error",(err) => {
            stream.end();
            stream.close();
            fs.unlinkSync(f);
            error(err);
        });
        file.Accept();
    });
    Obexd.Start(true);
}


//TODO: Implement Watcher Here

//TODO: Create mock directory structure for each user and so on...
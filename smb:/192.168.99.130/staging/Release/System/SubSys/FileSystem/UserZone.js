var Node = require("Node");
var smbd = require("../Native/smbd");
var obex = require("../Native/obex");
exports.Obexd = new obex.Obexpushd();
exports.Samba = new smbd.SmbDaemon(new smbd.SmbConfig());
function Initialize(cb) {
    trace("Init..");
    if (!Node.fs.existsSync(CONF.USER_DATA_PATH)) {
        info("Creating User Data Dir ..");
        Node.fs.mkdirSync(CONF.USER_DATA_PATH);
    }
    trace("Preparing User Root..");
    async.series([
        exec.bind(null, "chown", "nobody", "-R", CONF.USER_DATA_PATH),
        exec.bind(null, "chmod", "777", CONF.USER_DATA_PATH),
        mkStruct.bind(null, CONF.USER_DATA_PATH, {
            "FileTransfer": {}
        }, true)
    ], cb);
    var transfer_folder = Node.path.join(CONF.USER_DATA_PATH, "FileTransfer");
    exports.Samba.Config.Folders["Shared"] = {
        Guest_Ok: true,
        ReadOnly: false,
        Path: CONF.USER_DATA_PATH,
        Browseable: true,
        Comment: "Shared",
        Guest_Account: "nobody"
    };
    exports.Obexd.on("connection", function (file) {
        var curLen = 0;
        var n = file.Properties.Name;
        var c = n;
        var co = 0;
        while (Node.fs.existsSync(Node.path.join(transfer_folder, c))) {
            c = n.split(".")[0] + "(" + (co++) + ")" + n.substr(n.split(".")[0].length);
        }
        var f = Node.path.join(transfer_folder, c);
        trace(f);
        var stream = Node.fs.createWriteStream(f);
        file.on("data", function (buf) {
            curLen += buf.length;
            stream.write(buf);
        });
        file.on("end", function () {
            stream.end();
            stream.close();
            if (curLen != file.Properties.Length) {
                Node.fs.unlinkSync(f);
                warn("Broken file / Canceled!");
            }
        });
        file.on("error", function (err) {
            stream.end();
            stream.close();
            Node.fs.unlinkSync(f);
            error(err);
        });
        file.Accept();
    });
    exports.Obexd.Start(true);
}
exports.Initialize = Initialize;

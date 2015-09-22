var child_process = require("child_process");

function daemon(command, args, opts) {
    this.command = command;
    this.args = args || [];
    this.opts = opts;
    this.instance = undefined;
    this.forever = true;
}

daemon.prototype.start = function () {
    this.instance = child_process.spawn(this.command, this.args, this.opts);
    this.hook();
}
daemon.prototype.stop = function (signal) {
    if (this.instance) {
        this.forever = false;
        this.instance.kill(signal || "SIGKILL");
    }
}

daemon.prototype.hook = function () {
    (function (self) {
        self.instance.on("exit", function () {
            if(self.instance){
                self.instance.removeAllListeners();
            }
            self.instance = undefined;
            if (self.forever) {
                self.start();
            }
        });
    })(this);
}

module.exports = daemon;
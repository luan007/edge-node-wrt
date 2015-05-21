import nginx_conf = require("nginx-conf");
import Process = require("./Process");
import RPC = require("../../../Modules/RPC/index");
var nginxconf = nginx_conf.NginxConfFile;
import path = require("path");
import child_process = require("child_process");
import fs = require("fs");
import net = require("net");
import util = require("util");
import os = require("os");
import events = require("events");
import crypto = require("crypto");
import PermissionLib = require('../../API/Permission');
import Server = require('../../API/Server');

export var NGINX_PERM_ARR = [Permission.Proxy];
export var NGINX_PERMISSION = PermissionLib.Encode(NGINX_PERM_ARR);

export class nginx extends Process {

    //public Ctrl:CtrlInterface = new CtrlInterface();

    //private confPath = getSock(UUIDstr());

    private firstTime = true;

    constructor(APIPermissions?:any[]) {
        super("NGINX");
        //this.Ctrl.APIPermissions = APIPermissions;
    }

    Start(forever:boolean = true) {
        if (this.firstTime) {
            return killall("nginx", (err, result) => {
                this.firstTime = false;
                this.Start(forever);
            });
        }
        if (!this.IsChoking()) {
            //this.Ctrl.Init((err) => {
            //    if (err) {
            //        error("Error Generating Nginx Conf");
            //        error(err);
            //    } else {
            if (this.Process) {
                trace("Reload!");
                this.Process.kill("SIGHUP");
            } else {
                this.Process = child_process.spawn("nginx", [], {
                    env: {
                        LD_LIBRARY_PATH: "/opt/luajit/lib"
                    }
                });
                super.Start(forever);
            }
            //}
            //    });
        }
    }

    OnChoke() {
        warn("Killing all NGINX processes");
        this.Process = undefined;
        killall("nginx", () => {
            info("Done, waiting for recall");
            this.Choke_Timer = setTimeout(() => {
                this.ClearChoke();
                this.Start();
            }, 5000);
        });
        return true;
    }
}

import fs = require("fs");
import child_process = require("child_process");
import Process = require("./Process");
var _ = require("underscore");;

// man smb.conf
// VARIABLE SUBSTITUTIONS
/*
 %U
 session username (the username that the client wanted, not necessarily the same as the one they
 got).

 %G
 primary group name of %U.

 %h
 the Internet hostname that Samba is running on.

 %m
 the NetBIOS name of the client machine (very useful).

 This parameter is not available when Samba listens on port 445, as clients no longer send this
 information. If you use this macro in an include statement on a domain that has a Samba domain
 controller be sure to set in the [global] section smb ports = 139. This will cause Samba to not
 listen on port 445 and will permit include functionality to function as it did with Samba 2.x.

 %L
 the NetBIOS name of the server. This allows you to change your config based on what the client
 calls you. Your server can have a “dual personality”.

 %M
 the Internet name of the client machine.

 %R
 the selected protocol level after protocol negotiation. It can be one of CORE, COREPLUS, LANMAN1,
 LANMAN2, NT1, SMB2_02, SMB2_10, SMB2_22, SMB2_24, SMB3_00 or SMB2_FF.

 %d
 the process id of the current server process.

 %a
 The architecture of the remote machine. It currently recognizes Samba (Samba), the Linux CIFS file
 system (CIFSFS), OS/2, (OS2), Mac OS X (OSX), Windows for Workgroups (WfWg), Windows 9x/ME (Win95),
 Windows NT (WinNT), Windows 2000 (Win2K), Windows XP (WinXP), Windows XP 64-bit(WinXP64), Windows
 2003 including 2003R2 (Win2K3), and Windows Vista (Vista). Anything else will be known as UNKNOWN.

 %I
 the IP address of the client machine.

 Before 4.0.0 it could contain IPv4 mapped IPv6 addresses, now it only contains IPv4 or IPv6
 addresses.

 %i
 the local IP address to which a client connected.

 Before 4.0.0 it could contain IPv4 mapped IPv6 addresses, now it only contains IPv4 or IPv6
 addresses.

 %T
 the current date and time.

 %D
 name of the domain or workgroup of the current user.

 %w
 the winbind separator.

 %$(envvar)
 the value of the environment variable envar.

 The following substitutes apply only to some configuration options (only those that are used when a
 connection has been established):

 %S
 the name of the current service, if any.

 %P
 the root directory of the current service, if any.

 %u
 username of the current service, if any.

 %g
 primary group name of %u.

 %H
 the home directory of the user given by %u.

 %N
 the name of your NIS home directory server. This is obtained from your NIS auto.map entry. If you
 have not compiled Samba with the --with-automount option, this value will be the same as %L.

 %p
 the path of the service's home directory, obtained from your NIS auto.map entry. The NIS auto.map
 entry is split up as %N:%p.
 */

export class YesOrNo {
    static YES:string = "YES";
    static NO:string = "NO";
}

//Default: server role = AUTO
export class SmbConfServerRole {
    /*
     This is the default server role in Samba, and causes Samba to consult the security parameter (if
     set) to determine the server role, giving compatable behaviours to previous Samba versions.
     */
    static AUTO:string = "AUTO";
    /*
     If security is also not specified, this is the default security setting in Samba. In standalone
     operation, a client must first "log-on" with a valid username and password (which can be mapped
     using the username map parameter) stored on this machine. Encrypted passwords (see the encrypted
     passwords parameter) are by default used in this security mode. Parameters such as user and guest
     only if set are then applied and may change the UNIX user to use on this connection, but only after
     the user has been successfully authenticated.
     */
    static STANDALONE:string = "STANDALONE";
    /*
     This mode will only work correctly if net(8) has been used to add this machine into a Windows
     Domain. It expects the encrypted passwords parameter to be set to yes. In this mode Samba will try
     to validate the username/password by passing it to a Windows or Samba Domain Controller, in exactly
     the same way that a Windows Server would do.

     Note that a valid UNIX user must still exist as well as the account on the Domain Controller to
     allow Samba to have a valid UNIX account to map file access to. Winbind can provide this.
     */
    static MEMBER_SERVER:string = "MEMBER SERVER";
    /*
     This mode of operation runs a classic Samba primary domain controller, providing domain logon
     services to Windows and Samba clients of an NT4-like domain. Clients must be joined to the domain
     to create a secure, trusted path across the network. There must be only one PDC per NetBIOS scope
     (typcially a broadcast network or clients served by a single WINS server).
     */
    static CLASSIC_PRIMARY_DOMAIN_CONTROLLER:string = "CLASSIC PRIMARY DOMAIN CONTROLLER";
    /*
     This mode of operation runs a classic Samba backup domain controller, providing domain logon
     services to Windows and Samba clients of an NT4-like domain. As a BDC, this allows multiple Samba
     servers to provide redundant logon services to a single NetBIOS scope.
     */
    static NETBIOS_BACKUP_DOMAIN_CONTROLLER:string = "NETBIOS BACKUP DOMAIN CONTROLLER";
    /*
     This mode of operation runs Samba as an active directory domain controller, providing domain logon
     services to Windows and Samba clients of the domain. This role requires special configuration, see
     the Samba4 HOWTO
     */
    static ACTIVE_DIRECTORY_DOMAIN_CONTROLLER:string = "ACTIVE DIRECTORY DOMAIN CONTROLLER";
}

//Default: map tp guest =  NEVER
export class SmbConfMap2Guest {
    /*
     Means user login requests with an invalid password are rejected. This is the default.
     */
    static Never:string = "Never";
    /*
     Means user logins with an invalid password are rejected, unless the username does
     not exist, in which case it is treated as a guest login and mapped into the guest account.
     */
    static Bad_User:string = "Bad User";
    /*
     Means user logins with an invalid password are treated as a guest login and
     mapped into the guest account. Note that this can cause problems as it means that any user
     incorrectly typing their password will be silently logged on as "guest" - and will not know the
     reason they cannot access files they think they should - there will have been no message given
     to them that they got their password wrong. Helpdesk services will hate you if you set the map
     to guest parameter this way :-).
     */
    static Bad_Password:string = "Bad Password";
    /*
     Is only applicable when Samba is configured in some type of domain mode security
     (security = {domain|ads}) and means that user logins which are successfully authenticated but
     which have no valid Unix user account (and smbd is unable to create one) should be mapped to
     the defined guest account. This was the default behavior of Samba 2.x releases. Note that if a
     member server is running winbindd, this option should never be required because the nss_winbind
     library will export the Windows domain users and groups to the underlying OS via the Name
     Service Switch interface.
     */
    static Bad_Uid:string = "Bad Uid";
}

// user defined service: folder
export interface SmbConfFolder {
    Path: string;
    Comment: string;
    Guest_Ok: YesOrNo;
    Browseable: YesOrNo;
    Writeable?: YesOrNo;
    ReadOnly?: YesOrNo;
    CreateMask?: string;
    DirectoryMask?: string;
    Guest_Account?: string;
}
// user defined service: printer
export interface SmbConfPrinter {
    Path: string;
    Comment: string;
    Guest_Ok: YesOrNo;
    Browseable: YesOrNo;
    Printable: YesOrNo;
    Guest_Account?: string;
}

// common section: global printers print$ etc.
export interface SmbConfSection {
    [key: string]: any;
}

export class SmbConfig {
    public Folders:IDic<SmbConfFolder>;
    public Printers:IDic<SmbConfPrinter>;
    public CommonSections:IDic<SmbConfSection>;  //global/printers/print$

    constructor(commonSections?:IDic<SmbConfSection>) {
        this.Folders = {};
        this.Printers = {};
        this.CommonSections = commonSections || {
            "global": {
                "Available": YesOrNo.YES,
                "Follow_Symlinks": YesOrNo.NO,
                "Wide_Links": YesOrNo.NO,
                "Use_SendFile": YesOrNo.YES,
                "Read_Raw": YesOrNo.YES,
                "Write_Raw": YesOrNo.YES,
                //"AIO_Read_Size": 16384,
                //"AIO_Write_Size": 16384,
                "Write_Cache_Size": 262144,
                //"Max_Xmit": 65536,
                "Large_Readwrite": YesOrNo.YES,
                //"Getwd_cache": YesOrNo.YES,
                "Workgroup": "WORKGROUP",
                "Local Master": YesOrNo.YES,
                "Preferred Master": YesOrNo.YES,
                "OS Level": 200,
                "Server_String": "Edge Server",
                "Guest_Account": "nobody",
                "Netbios_Name": "edge",
                "Dns_Proxy": YesOrNo.NO,
                //"Wins_Support": YesOrNo.YES,
                "Server_Role": SmbConfServerRole.STANDALONE,
                "Map_To_Guest": SmbConfMap2Guest.Bad_User,
                //"Name_Resolve_Order": "host wins bcast"
            },
            "printers": {
                "Comment": "All printers",
                "Path": "/var/spool/samba",
                "Create_Mask": "0700",
                "Printable": YesOrNo.YES,
                "Browseable": YesOrNo.YES
            },
            "print$": {
                "Comment": "Printer Drivers",
                "Path": "/var/lib/samba/printers"
            }
        };
    }

    private Normalize(){
        var conf = _.clone(this);
        var netbiosName = conf.CommonSections["global"]["Netbios_Name"].replace(/ /gi, "_"),
            len = netbiosName.length;
        if(netbiosName){
            conf.CommonSections["global"]["Netbios_Name"] = (len > 15 ? netbiosName.substr(0, 15) : netbiosName);
        }
        return conf;
    }

    public ToConf = () => {
        var newConf = "";
        var util = require("util"); // Node.util

        var conf = this.Normalize();

        for (var topKey in this) {
            for (var sectionName in conf[topKey]) {
                newConf += util.format("[%s]\n", sectionName);
                for (var k in conf[topKey][sectionName]) {
                    newConf += util.format("\t%s = %s\n", k.replace(/_/g, ' '), conf[topKey][sectionName][k]);
                }
            }
        }

        return newConf;
    };
}

export class SmbDaemon extends Process {
    static SMBD_NAME = "smbd";
    static NMDB_NAME = "nmbd";

    public Config:SmbConfig;
    public OutputLevel:number;

    private _ad1;
    private _ad2;

    private _path_conf = getSock(UUIDstr());

    constructor(config:SmbConfig, outputLevel:number = 3) {
        super(SmbDaemon.SMBD_NAME);
        if (CONF.IS_DEBUG && CONF.DISABLE_SAMBA) {
            this.BypassStabilityTest = true;
        }
        this.Config = config;
        this.OutputLevel = outputLevel;
    }



    Start(forever: boolean = true) {
        if (CONF.IS_DEBUG && CONF.DISABLE_SAMBA) {
            if(CONF.DISABLE_SAMBA) fatal('************ samba was disabled ***********');
            return;
        }
        if (!this.IsChoking()) {
            var changed = false;
            var conf = this.Config.ToConf();
            if (didChange(this._path_conf, conf)) {
                if (fs.existsSync(this._path_conf) && fs.unlinkSync(this._path_conf));
                fs.writeFileSync(this._path_conf, this.Config.ToConf());
                changed = true;
            }
            if (this._ad1) {
                this._ad1.stop();
                this._ad1 = undefined;
            }
            if (this._ad2) {
                this._ad2.stop();
                this._ad2 = undefined;
            }
            if (this.Config.CommonSections["global"]["Available"] === YesOrNo.YES) {
                this._ad1 = mdns.createAdvertisement(mdns.tcp('smb'), 445, {
                    name: this.Config.CommonSections["global"]["Netbios_Name"]
                });
                this._ad1.start();
                this._ad2 = mdns.createAdvertisement(mdns.tcp('device-info'), 0, {
                    name: this.Config.CommonSections["global"]["Netbios_Name"],
                    txtRecord: {
                        model: "AirPort"
                    }
                });
                this._ad2.start();
            }
            if (this.Process) {
                if (changed) {
                    this.Process.kill("SIGHUP"); //no more rebootz, BITCHES
                    info("OK");
                    this.RestartNMDB();
                    super.Start(forever);
                } else {
                    info("No change, skipped");
                }
            } else {
                killall(SmbDaemon.SMBD_NAME,() => {
                    this.Process = child_process.spawn(SmbDaemon.SMBD_NAME, [
                        "-F",
                        "--log-stdout",
                        "-s=" + this._path_conf,
                        "-d=" + this.OutputLevel], {
                            stdio: ['ignore', 'ignore', 'ignore']
                        });
                    //this.Process.stdout.on("data", function (data) {
                    //    info(data.toString());
                    //});
                    info("OK");
                    this.RestartNMDB();
                    super.Start(forever);
                });
            }
        }
    }

    Stop(restart: boolean = false) {
        if (this._ad1) {
            this._ad1.stop();
            this._ad1 = undefined;
        }
        if (this._ad2) {
            this._ad2.stop();
            this._ad2 = undefined;
        }
        this.KillNMDB(super.Stop.bind(null, restart));
    }

    Apply = (forever:boolean = true) => { //as helper method
        this.Start(forever);
    };

    RestartNMDB() {
        this.KillNMDB(() => {
            exec(SmbDaemon.NMDB_NAME, "-s=" + this._path_conf);
        });
    }

    KillNMDB(cb){
        killall(SmbDaemon.NMDB_NAME, cb);
    }

    OnChoke() {
        super.OnChoke();
        info("Killing all SMBD processes");
        this.Process.removeAllListeners();
        this.Process = undefined;
        killall(SmbDaemon.SMBD_NAME, () => {
            this.KillNMDB(() => {
                info("Done, waiting for recall");
                this.Choke_Timer = setTimeout(() => {
                    this.ClearChoke();
                    this.Start();
                }, 2000);
            });
        });
        return true;
    }
}

//test suits
//var conf = new SmbConfig();
//conf.Printers["printer1"] = {
//    Path: "192.168.1.23",
//    Comment: "Printer1",
//    Guest_Ok: YesOrNo.YES,
//    Browseable: YesOrNo.YES,
//    Printable: YesOrNo.YES
//};
//conf.Folders["folder1"] = {
//    Path: "/folder1",
//    Comment: "folder1",
//    Guest_Ok: YesOrNo.YES,
//    Browseable: YesOrNo.YES,
//    Writeable: YesOrNo.YES
//};
//console.log(conf.ToConf());
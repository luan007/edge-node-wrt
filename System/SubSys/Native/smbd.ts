﻿import Core = require("Core");
import Node = require("Node");
import Process = require("./Process");

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

export enum YesOrNo{
    NO = 0,
    YES = 1
}

//Default: server role = AUTO
export enum SmbConfServerRole{
    /*
     This is the default server role in Samba, and causes Samba to consult the security parameter (if
     set) to determine the server role, giving compatable behaviours to previous Samba versions.
     */
    AUTO = 0,
    /*
     If security is also not specified, this is the default security setting in Samba. In standalone
     operation, a client must first "log-on" with a valid username and password (which can be mapped
     using the username map parameter) stored on this machine. Encrypted passwords (see the encrypted
     passwords parameter) are by default used in this security mode. Parameters such as user and guest
     only if set are then applied and may change the UNIX user to use on this connection, but only after
     the user has been successfully authenticated.
     */
    STANDALONE = 1,
    /*
     This mode will only work correctly if net(8) has been used to add this machine into a Windows
     Domain. It expects the encrypted passwords parameter to be set to yes. In this mode Samba will try
     to validate the username/password by passing it to a Windows or Samba Domain Controller, in exactly
     the same way that a Windows Server would do.

     Note that a valid UNIX user must still exist as well as the account on the Domain Controller to
     allow Samba to have a valid UNIX account to map file access to. Winbind can provide this.
     */
    MEMBER_SERVER = 2,
    /*
     This mode of operation runs a classic Samba primary domain controller, providing domain logon
     services to Windows and Samba clients of an NT4-like domain. Clients must be joined to the domain
     to create a secure, trusted path across the network. There must be only one PDC per NetBIOS scope
     (typcially a broadcast network or clients served by a single WINS server).
     */
    CLASSIC_PRIMARY_DOMAIN_CONTROLLER = 3,
    /*
     This mode of operation runs a classic Samba backup domain controller, providing domain logon
     services to Windows and Samba clients of an NT4-like domain. As a BDC, this allows multiple Samba
     servers to provide redundant logon services to a single NetBIOS scope.
     */
    NETBIOS_BACKUP_DOMAIN_CONTROLLER = 4,
    /*
     This mode of operation runs Samba as an active directory domain controller, providing domain logon
     services to Windows and Samba clients of the domain. This role requires special configuration, see
     the Samba4 HOWTO
     */
    ACTIVE_DIRECTORY_DOMAIN_CONTROLLER = 5
}

//Default: map tp guest =  NEVER
export enum SmbConfMap2Guest{
    /*
     Means user login requests with an invalid password are rejected. This is the default.
     */
    Never = 0,
    /*
     Means user logins with an invalid password are rejected, unless the username does
     not exist, in which case it is treated as a guest login and mapped into the guest account.
     */
    BadUser = 1,
    /*
     Means user logins with an invalid password are treated as a guest login and
     mapped into the guest account. Note that this can cause problems as it means that any user
     incorrectly typing their password will be silently logged on as "guest" - and will not know the
     reason they cannot access files they think they should - there will have been no message given
     to them that they got their password wrong. Helpdesk services will hate you if you set the map
     to guest parameter this way :-).
     */
    BadPassword = 2,
    /*
     Is only applicable when Samba is configured in some type of domain mode security
     (security = {domain|ads}) and means that user logins which are successfully authenticated but
     which have no valid Unix user account (and smbd is unable to create one) should be mapped to
     the defined guest account. This was the default behavior of Samba 2.x releases. Note that if a
     member server is running winbindd, this option should never be required because the nss_winbind
     library will export the Windows domain users and groups to the underlying OS via the Name
     Service Switch interface.
     */
    BadUid = 3
}

//Default: security = USER
export enum SmbConfSecurity {
    /*
     This is the default security setting in Samba, and causes Samba to consult the server role
     parameter (if set) to determine the security mode.
     */
    AUTO = 0,
    /*
     If server role is not specified, this is the default security setting in Samba. With user-level
     security a client must first "log-on" with a valid username and password (which can be mapped using
     the username map parameter). Encrypted passwords (see the encrypted passwords parameter) can also
     be used in this security mode. Parameters such as user and guest only if set are then applied and
     may change the UNIX user to use on this connection, but only after the user has been successfully
     authenticated.

     Note that the name of the resource being requested is not sent to the server until after the server
     has successfully authenticated the client. This is why guest shares don't work in user level
     security without allowing the server to automatically map unknown users into the guest account. See
     the map to guest parameter for details on doing this.
     */
    USER = 1,
    /*
     This mode will only work correctly if net(8) has been used to add this machine into a Windows NT
     Domain. It expects the encrypted passwords parameter to be set to yes. In this mode Samba will try
     to validate the username/password by passing it to a Windows NT Primary or Backup Domain
     Controller, in exactly the same way that a Windows NT Server would do.

     Note that a valid UNIX user must still exist as well as the account on the Domain Controller to
     allow Samba to have a valid UNIX account to map file access to.

     Note that from the client's point of view security = domain is the same as security = user. It only
     affects how the server deals with the authentication, it does not in any way affect what the client
     sees.

     Note that the name of the resource being requested is not sent to the server until after the server
     has successfully authenticated the client. This is why guest shares don't work in user level
     security without allowing the server to automatically map unknown users into the guest account. See
     the map to guest parameter for details on doing this.

     See also the password server parameter and the encrypted passwords parameter.

     Note that the name of the resource being requested is not sent to the server until after the server
     has successfully authenticated the client. This is why guest shares don't work in user level
     security without allowing the server to automatically map unknown users into the guest account. See
     the map to guest parameter for details on doing this.

     See also the password server parameter and the encrypted passwords parameter.
     */
    DOMAIN = 2,
    /*
     In this mode, Samba will act as a domain member in an ADS realm. To operate in this mode, the
     machine running Samba will need to have Kerberos installed and configured and Samba will need to be
     joined to the ADS realm using the net utility.

     Note that this mode does NOT make Samba operate as a Active Directory Domain Controller.

     Read the chapter about Domain Membership in the HOWTO for details.
     */
    ADS = 3
}

//[global]
export interface SmbConfGlobalSection {
    Workgroup: string;
    ServerString: string;
    GuestAccount: string;
    DnsProxy: YesOrNo;
    ServerRole: SmbConfServerRole;
    MapToGuest: SmbConfMap2Guest;
    //UsershareAllowGuests: YesOrNo;
    //UsersharePath?: string;
    //UsershareMaxShares?: number;
    //Security?: SmbConfSecurity;
}

//common section
export interface SmbConfService {
    Path: string;
    Comment: string;
    GuestOk: YesOrNo;
    Browseable: YesOrNo;
    Printable?: YesOrNo;
    Writeable?: YesOrNo;
    ReadOnly?: YesOrNo;
    CreateMask?: string;
    DirectoryMask?: string;
}

export class SmbConfigBase {
    public GlobalConfSection: SmbConfGlobalSection;
    public Folders : IDic<SmbConfService>;
    public Printers : IDic<SmbConfService>;

    constructor(globalConfSection?: SmbConfGlobalSection){
        this.Folders = {};
        this.Printers = {};
        this.GlobalConfSection = globalConfSection || {
            Workgroup : "workgroup",
            ServerString : "%h server (Samba, Ubuntu)",
            GuestAccount: "nobody",
            DnsProxy: YesOrNo.NO,
            ServerRole: SmbConfServerRole.STANDALONE
        };
    }

    public ToString(){
        //TODO: complete toString
    }
}

export class SmbDaemon extends Process {

}
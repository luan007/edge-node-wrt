
interface ARP_Record {
    ipAddress: string;
    MAC: string;
    scanTime: number;
}

declare function macaddr(ipAddress, callback: Callback);
declare function parseUA(req): any;
declare var UAParser;

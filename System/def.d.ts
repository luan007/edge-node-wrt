declare var Dnsmasq: {
    GetLease(mac);
    GenerateConfig(cb);
    Fetch(cb);
    IsAlive(cb);
    FileChanged(cb);
    Start();
    Config: string;
    GetLease(mac);
}

declare var Hostapd: {
    Start2G();
    Start5G();
    IsAlive2G(cb);
    IsAlive5G(cb);
    Fetch2G(cb);
    Fetch5G(cb);
    FileChanged(cb);
    Config2G:string;
    Config5G:string;
    GenerateConfig2G(cb);
    GenerateConfig5G(cb);
    GetStation(mac);
}

declare var Udhcpc: {
    IsAlive(cb);
    Start(cb);
}

declare var Utils: {
    QueryProcess(name, cb);
}

declare var Agency: {
    Register(name, e, f);
    Trigger(name, e, ...args);
}

declare var WifiBus: {
    OnLease(e, lease);
    DropLease(e, lease);
    OnStation(e, station);
    DropStation(e, station);
}
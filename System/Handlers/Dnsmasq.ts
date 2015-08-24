var Section = require("../CI/Section");

export function Config(cb) {
    var handler = Section.GetSection(SECTION_CONST.NETWORK_DNSMASQ);
    handler.Write("-k");
    handler.Write("--dhcp-script", "/ramdisk/System/Configs/Scripts/dnsmasq_send.sh");
    handler.Write("--dhcp-option", "44,6");
    handler.Write("--dhcp-option", "6," + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--listen-address", SECTION_CONST.NETWORK_ADDRESS + ",127.0.0.1");
    handler.Write("--expand-hosts");
    handler.Write("--stop-dns-rebind");
    handler.Write("--dhcp-sequential-ip");
    handler.Write("--domain", "edge");
    handler.Write("--dhcp-range", SECTION_CONST.NETWORK_ADDRESS_BEGIN + "," + SECTION_CONST.NETWORK_ADDRESS_END);
    handler.Write("--cache-size", "4096");
    handler.Write("--address", "/.wi.fi/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--address", "/.wifi.network/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--address", "/.ed.ge/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--address", "/.wifi/" + SECTION_CONST.NETWORK_ADDRESS);
    handler.Write("--addn-hosts", "/ramdisk/System/Configs/Miscs/dnsmasq_dhcp_hostsfile.conf");
    handler.Write("--dhcp-hostsfile", "/ramdisk/System/Configs/Miscs/dnsmasq_addn_hosts.conf");
    handler.Write("--servers-file", "/ramdisk/System/Configs/Miscs/dnsmasq_server_file.conf");

    handler.Flush(cb);
}
module.exports.translate = function(key, source, targetConfs){
    if (key === "routerip") {
        targetConfs["dhcp-option"] = [
            "46,8"
            , "6," + source
        ];
        targetConfs["listen-address"] = source + ",127.0.0.1";
        targetConfs["address"] = [
            "/.wi.fi/" + source
            , "/.wifi.network/" + source
            , "/.ed.ge/" + source
            , "/.wifi/" + source
        ];
    } else if (key === "dhcp_range") {
        targetConfs["dhcp-range"] = source.start + "," + source.end;
    } else if (key === "domain") {
        targetConfs["domain"] = source;
    }
}
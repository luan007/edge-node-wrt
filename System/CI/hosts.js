module.exports.translate = function(host, ip, targetConfs){
    targetConfs[host] = ip + " " + host;
}
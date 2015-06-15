import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../Common/Stat/StatMgr');
import _P0F = require('../Common/Native/p0f');
var UAParser = require('ua-parser-js');
var parser = new UAParser.UAParser();
import P0F = _P0F.P0F;

var sock = getSock(UUIDstr());
var p0fInstance = new P0F(CONF.DEV.WLAN.WLAN_BR, p0fOutputHandle, sock);

/**
 .-[ 192.168.1.10/53680 -> 22.33.99.201/80 (http request) ]-
 |
 | client   = 192.168.1.10/53680
 | app      = ???
 | lang     = Chinese
 | params   = none
 | raw_sig  = 1:Host,Connection=[keep-alive],Accept=[*//*],User-Agent,Accept-Language=[zh-cn],?Referer,Accept-Encoding=[gzip, deflate]:Accept-Charset,Keep-Alive:Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4
 |
 `----

 .-[ 192.168.1.11/51130 -> 92.61.148.154/80 (http request) ]-
 |
 | client   = 192.168.1.11/51130
 | app      = ???
 | lang     = English
 | params   = none
 | raw_sig  = 1:Accept=[text/html, application/xhtml+xml, *//*],Accept-Language=[en-US,zh-Hans-CN;q=0.9,zh-Hans;q=0.7,en-GB;q=0.6,en;q=0.4,zh-Hant-HK;q=0.3,zh-Hant;q=0.1],User-Agent,UA-CPU=[ARM],Accept-Encoding=[gzip, deflate],Host,DNT=[1],Connection=[Keep-Alive]:Accept-Charset,Keep-Alive:Mozilla/5.0 (Mobile; Windows Phone 8.1; Android 4.0; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; 909) like iPhone OS 7_0_3 Mac OS X AppleWebKit/537 (KHTML, like Gecko) Mobile Safari/537
 |
 `----
 */
function p0fOutputHandle(data) {
    var info = data.toString();
    if(/\(http request\)/.test(info)) {
        var description = <any>getDeviceInfo(info);
        if(description && description.device.vendor === 'Apple' && description.device.model === 'iPhone') {
            fatal("[[[ ============ ]]] \n", description);
            __EMIT('P0F.iPhone', description);
        }
    }
}

function getDeviceInfo(data) {
    var description = parser.setUA(data).getResult();
    if(description.device.vendor && description.os.name) {
        return description;
    }
    return null;
    //if(/iPhone/gmi.test(data) && /Apple/gmi.test(data)) {
    //    return {
    //        BrandName: 'Apple',
    //        ModelName: 'iPhone'
    //    };
    //} else if(/Windows Phone/gmi.test(data) && /NOKIA/gmi.test(data)) {
    //    return {
    //        BrandName: 'NOKIA',
    //        ModelName: 'Windows Phone'
    //    };
    //}
}

export function Initialize(cb) {
    p0fInstance.Start(true);
    cb();
}

__EVENT('P0F.iPhone', [Permission.Driver]);
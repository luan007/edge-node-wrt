import ConfMgr = require('../Common/Conf/ConfMgr');
import _Config = require('../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../Common/Stat/StatMgr');
import _P0F = require('../Common/Native/p0f');
import P0F = _P0F.P0F;

var p0fInstance = new P0F(CONF.DEV.WLAN.WLAN_BR, p0fOutputHandler);

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
 */
function p0fOutputHandler(data) {
    var info = data.toString();
    if(/\(http request\)/.test(info)) {
        var device = <any>getDeviceInfo(info);
        if(device && device.BrandName === 'Apple' && device.ModelName === 'iPhone') {
            fatal("[[[ ============ ]]] \n", device);
            __EMIT('P0F.iPhone', device);
        }
    }
}

function getDeviceInfo(data) {
    if(/iPhone/gmi.test(data) && /Apple/gmi.test(data)) {
        return {
            BrandName: 'Apple',
            ModelName: 'iPhone'
        };
    }
    return null;
}

export function Initialize(cb) {
    p0fInstance.Start(true);
    cb();
}

__EVENT('P0F.iPhone', [Permission.Driver]);
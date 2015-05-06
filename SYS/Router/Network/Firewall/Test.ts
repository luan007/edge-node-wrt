import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');

function Initialize() {
    info('start firewall testing...');
    var BlockedRemoteAddresses = [];
    var confFirewall:any = ConfMgr.Get(SECTION.FIREWALL);
    if (confFirewall && confFirewall.BlockedRemoteAddresses)
        BlockedRemoteAddresses = confFirewall.BlockedRemoteAddresses;
    BlockedRemoteAddresses.push('www.moye.me');

    ConfMgr.Set(SECTION.FIREWALL, {BlockedRemoteAddresses: BlockedRemoteAddresses});
    ConfMgr.Commit();

    setTimeout(() => {
        ConfMgr.Set(SECTION.FIREWALL, {BlockedRemoteAddresses: ['www.baidu.com']});
        ConfMgr.Commit();
    }, 2000);

    setTimeout(() => {
        ConfMgr.Set(SECTION.FIREWALL, {BlockedRemoteAddresses: ['www.csdn.net']});
        ConfMgr.Commit();
    }, 6000);
}

Initialize();
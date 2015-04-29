import ConfMgr = require('../../../Common/Conf/ConfMgr');
import _Config = require('../../../Common/Conf/Config');
import Config = _Config.Config;
import StatMgr = require('../../../Common/Stat/StatMgr');
import Status = require('../../../Common/Stat/Status');

function Initialize() {
    info('start firewall testing...');
    var BlockedRemoteAddresses = [];
    var confFirewall:any = ConfMgr.Get(SECTION.FIREWALL);
    if(confFirewall && confFirewall.BlockedRemoteAddresses)
        BlockedRemoteAddresses = confFirewall.BlockedRemoteAddresses;
    BlockedRemoteAddresses.push('www.baidu.com');

    ConfMgr.Set(SECTION.FIREWALL, {BlockedRemoteAddresses: BlockedRemoteAddresses});
    ConfMgr.Commit();
}

Initialize();
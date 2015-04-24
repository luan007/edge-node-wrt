//import _Status = require('../Status');
//import Status = _Status.Status;
import ConfMgr = require('../ConfMgr');

(() => {

    ConfMgr.Set('network', {'NetworkName': 'edge-dev'});
    ConfMgr.Set('network', {'RouterIP': '192.168.133.1'});
    ConfMgr.Commit();

})();
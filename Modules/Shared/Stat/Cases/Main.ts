//import _Status = require('../Status');
//import Status = _Status.Status;
import ConfMgr = require('../ConfMgr');

(()=> {

    SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
        ConfMgr.Initialize(); // load & trigger
    });

})();
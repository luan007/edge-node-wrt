eval(LOG("Common:Events:SystemEvent"));

import event = require("events");
var _e = new event.EventEmitter();

function _listen(name, cb) {
    _e.on(name, cb);
}

function _remove_listener(name, cb) {
    _e.removeListener(name, cb);
}

function _emit(name, data: any[]) {
    info(" SYSEVENT > " + SYS_EVENT_TYPE[name]);
    var arr = [name];
    _e.emit.apply(_e, arr.concat(data));
}

enum SYS_EVENT_TYPE {
    LOADED,
    ERROR,
}
global.SYS_EVENT_TYPE = SYS_EVENT_TYPE;
global.SYS_ON = _listen;
global.SYS_REMOVELISTENER = _remove_listener;
global.SYS_TRIGGER = _emit;
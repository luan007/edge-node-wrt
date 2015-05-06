import events = require('events');

export class StatNode extends events.EventEmitter {
    public __name:string;
    public __value:any = {};
    private __parent:StatNode;

    constructor(name:string, value:any, parent:StatNode = null) {
        super();

        this.__name = name;
        this.__value = value;
        this.__parent = parent;

        if (typeof this.__value === 'object') {
            for (var k in this.__value) {
                ((self, _k) => {
                    self._wrap(self, _k);
                })(this, k);
            }
        }
    }

    _wrap = (self, _k) => {
        if (!self.__value[_k].hasOwnProperty('_wrap') && typeof self.__value[_k] === 'object') {
            self.__value[_k] = new StatNode(_k, self.__value[_k], self);
        }
        if (!self.hasOwnProperty(_k)) {
            Object.defineProperty(self, _k, {
                get: function () {
                    return self.__value[_k];
                }
            });
        }
    }

    _notifyParent = (_self, _action, _k, old, val) => {
        if (_self.__parent) {
            var levelKey = _self.__name + '.' + _k;
            var wildcard = _self.__name + '.*';
            _self.__parent.emit(wildcard, _k, old, val);
            _self.__parent.emit(levelKey, old, val);
            _self.__parent.emit(_action, levelKey, old, val);
        }
    }

    set = (key:string, val:any) => {
        var oldValue = this.__value[key] ? (this.__value[key].valueOf ? this.__value[key].valueOf() : this.__value[key]) : undefined;
        var newValue = val.valueOf ? val.valueOf() : val;
        this._notifyParent(this, 'set', key, oldValue, newValue);
        this.emit(key, oldValue, newValue);
        this.emit('set', key, oldValue, newValue);
        this.__value[key] = val;
        ((self, _k)=> {
            self._wrap(self, _k);
        })(this, key);
    }

    del = (key:string) => {
        if (this.__value.hasOwnProperty(key)) {
            var oldValue = this.__value[key].valueOf ? this.__value[key].valueOf() : this.__value[key];
            this._notifyParent(this, 'del', key, oldValue, undefined);
            this.emit(key, oldValue, undefined);
            this.emit('del', key, oldValue, undefined);
            if (this.__value[key].removeAllListeners)
                this.__value[key].removeAllListeners();
            delete this.__value[key];
            delete this[key];
        }
    }

    valueOf = () => {
        return this.__value;
    }
}
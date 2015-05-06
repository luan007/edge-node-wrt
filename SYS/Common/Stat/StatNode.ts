import events = require('events');

export class StatNode extends events.EventEmitter {
    public __name:any;
    public __value:any;
    private parent:StatNode;

    constructor(name:string, value:any, parent:StatNode = null) {
        super();

        this.__name = name;
        this.__value = value;
        this.parent = parent;

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

    _notifyParent = (_self, _action, _k, val) => {
        if (_self.parent) {
            var levelKey = _self.__name + '.' + _k;
            var wildcard = _self.__name + '.*';
            _self.parent.emit(wildcard, _k, _self.__value[_k], val);
            _self.parent.emit(levelKey, _self.__value[_k], val);
            _self.parent.emit(_action, levelKey, _self.__value[_k], val);
        }
    }

    set = (key:string, val:any) => {
        this._notifyParent(this, 'set', key, val);
        this.emit(key, this.__value[key], val);
        this.emit('set', key, this.__value[key], val);
        this.__value[key] = val;
        if (!this.hasOwnProperty(key)) {
            ((self, _k)=> {
                self._wrap(self, _k);
            })(this, key);
        }
    }

    del = (key:string) => {
        if (this.__value.hasOwnProperty(key)) {
            this._notifyParent(this, 'del', key, undefined);
            this.emit(key, this.__value[key], undefined);
            this.emit('del', key, this.__value[key], undefined);
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
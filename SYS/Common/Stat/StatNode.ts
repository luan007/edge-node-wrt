import events = require('events');

export class StatNode extends events.EventEmitter {
    public name:any;
    public value:any;
    private parent:StatNode;

    constructor(name:string, value:any, parent:StatNode = null) {
        super();

        this.name = name;
        this.value = value;
        this.parent = parent;

        if (typeof this.value === 'object') {
            for (var k in this.value) {
                ((self, _k)=> {
                    this._wrap(self, _k);
                })(this, k);
            }
        }
    }

    _wrap = (_k, self) => {
        if (typeof self.value[_k] === 'object') {
            self.value[_k] = new StatNode(_k, self.value[_k], self);
        }

        Object.defineProperty(self, _k, {
            get: function () {
                return self.value[_k];
            }
        });
    }

    _notifyParent = (_self, _action, _k, val) => {
        if(_self.parent) {
            var levelKey = _self.name + '.' + _k;
            var wildcard = _self.name + '.*';
            _self.parent.emit(wildcard, _k, _self.value[_k], val);
            _self.parent.emit(levelKey, _self.value[_k], val);
            _self.parent.emit(_action, levelKey, _self.value[_k], val);
        }
    }

    set = (key:string, val:any) => {
        this._notifyParent(this, 'set', key, val);
        this.emit(key, this.value[key], val);
        this.emit('set', key, this.value[key], val);
        this.value[key] = val;
        if (!this.hasOwnProperty(key)) {
            ((self, _k)=> {
                this._wrap(self, _k);
            })(this, key);
        }
    }

    del = (key:string) => {
        if (this.value.hasOwnProperty(key)) {
            this._notifyParent(this, 'del', key, undefined);
            this.emit(key, this.value[key], undefined);
            this.emit('del', key, this.value[key], undefined);
            if (this.value[key].removeAllListeners)
                this.value[key].removeAllListeners();
            delete this.value[key];
            delete this[key];
        }
    }
}
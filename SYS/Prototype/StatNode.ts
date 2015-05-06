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
                    if (typeof self.value[_k] === 'object') {
                        self.value[_k] = new StatNode(_k, self.value[_k], self);
                    }

                    Object.defineProperty(self, _k, {
                        get: function () {
                            return self.value[_k];
                        }
                    });
                })(this, k);
            }
        }
    }

    set = (key:string, val:any) => {
        if (this.parent) {
            var levelKey = this.name + '.' + key;
            var wildcard = this.name + '.*';
            this.parent.emit(wildcard, key, this.value[key], val);
            this.parent.emit(levelKey, this.value[key], val);
            this.parent.emit('set', levelKey, this.value[key], val);
        }
        this.emit(key, this.value[key], val);
        this.emit('set', key, this.value[key], val);
        this.value[key] = val;
        if (!this.hasOwnProperty(key)) {
            Object.defineProperty(this, key, {
                get: function () {
                    return this.value[key];
                }
            });
        }
    }

    del = (key:string) => {
        if (this.value.hasOwnProperty(key)) {
            this.emit(key, this.value[key], undefined);
            this.emit('del', key, this.value[key], undefined);
            if (this.value[key].on)
                this.value[key].removeAllListeners();
            delete this.value[key];
            delete this[key];
        }
    }
}
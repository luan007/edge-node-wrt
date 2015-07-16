import events = require('events');

class StatNode extends events.EventEmitter {
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
        if (!has(self.__value[_k], '_wrap') && typeof self.__value[_k] === 'object') {
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

    //TODO: Allow correct multilayer event behaviour
    //Network.Test.on("a")
    //Network.on("*.*");
    //Network.on("*");
    //Network.on("Test.*");
    //'Test.a'
    //
    _notifyParent = (_self, _action, _k, old, val) => {
        if (_self.__parent) {
            var levelKey = _self.__name + '.' + _k;
            var wildcard = _self.__name + '.*';
            this.__parent.emit(wildcard, old, val);
            this.__parent.emit(levelKey, old, val);
            this.__parent.emit(_action, levelKey, old, val);
            this.__parent.emit(_action, wildcard, old, val);
            this._notifyParent(_self.__parent, _action, levelKey, old, val);
            this._notifyParent(_self.__parent, _action, wildcard, old, val);
        } 
    }
    
    _notifyAPI = (_self, _action, level, origin_k, old, val) => {
        if (_self.__parent) {
            level = _self.__parent.__name + "." + level;
            this._notifyAPI(_self.__parent, _action, level, origin_k, old, val);
        } else {
            __EMIT("Stat." + _action, level, origin_k, old, val);
        }
    }
    
    Set = (key:string, val:any) => {
        if(val === undefined || val === null) return;
        var oldValue = this.__value[key] ? (this.__value[key].ValueOf ? this.__value[key].ValueOf() : this.__value[key]) : undefined;
        var newValue = val.ValueOf ? val.ValueOf() : JSON.parse(JSON.stringify(val));


        this._notifyParent(this, 'set', key, oldValue, newValue);
        this._notifyAPI(this, 'set', this.__name, key, oldValue, newValue);
        this.emit(key, oldValue, newValue);
        this.emit('set', key, oldValue, newValue);
        
        if(!val._wrap && !val.ValueOf){
            val = JSON.stringify(val);
        }
        this.__value[key] = val;
        this._wrap(this, key);

        if(this.__value[key] && this.__value[key].emit) //emit if child is a emitter
            this.__value[key].emit('set', key, oldValue, newValue);
    }

    Del = (key:string) => {
        if (this.__value.hasOwnProperty(key)) {
            var oldValue = this.__value[key].ValueOf ? this.__value[key].ValueOf() : this.__value[key];
            this._notifyParent(this, 'del', key, oldValue, undefined);
            this.emit(key, oldValue, undefined);
            this.emit('del', key, oldValue, undefined);
            if(this.__value[key] && this.__value[key].emit) //emit if child is a emitter
                this.__value[key].emit('del', oldValue, undefined);
            if (this.__value[key].removeAllListeners)
                this.__value[key].removeAllListeners();
            delete this.__value[key];
            delete this[key];
        }
    }

    ValueOf = () => {
        var valueOf = StatNode.ExtractProperties(this);
        //warn('valueOf', valueOf);
        return valueOf;
    }
    
    Get = (k) => {
        return this.__value[k];
    }

    static IsStatNode = (obj) => {
        if(!obj) return false;
        return obj.hasOwnProperty('_wrap') && obj.hasOwnProperty('__value') && obj.hasOwnProperty('ValueOf');
    }

    static ExtractProperties = (obj) => {
        if(StatNode.IsStatNode(obj)){
            var res = {};
            for(var k in obj.__value){
                res[k] = StatNode.ExtractProperties(obj.__value[k]);
            }
            return res;
        } else {
            return obj;
        }
    }
}

class StatMgr {
    private _statuses:{ [key: string]: StatNode; } = {};

    Pub = (k:string, statusObject:Object): any => {
        if(!this._statuses[k])
            this._statuses[k] = new StatNode(k, statusObject);
        return this._statuses[k];
    }

    Sub = (k:string): any => {
        if(this._statuses[k])
            return this._statuses[k];
        else
            throw new Error(k + ' does not exist yet.');
    }

    Get = (k:string): any => {
        return this._statuses[k];
    }
    
    RecursiveGet = (k:string) : any => {
        var sp = k.split('.');
        if(sp.length === 0) return undefined;
        var cur = this;
        for(var i = 0; i < sp.length; i++){
            cur = cur.Get(sp[i]);
            if(!cur) return undefined;
        }
        if(cur === this){
            return undefined;
        }
        return cur;
    }
}

var statMgr = new StatMgr();
export = statMgr;

global.StatMgr = statMgr;

__EVENT("Stat.set", [Permission.AnyApp]);
__EVENT("Stat.del", [Permission.AnyApp]);

__API((k, cb)=>{
    var d = statMgr.RecursiveGet(k);
    if(!d) {
        return cb(new Error('Not Found'));
    } else {
        return cb(undefined, d.ValueOf ? d.ValueOf() : d);
        
    }
}, "Stat.Get");

// __API('Stat.Get');

//TODO: Stat should be refactorized into seperate events

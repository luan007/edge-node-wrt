import events = require("events");

export interface Trackable {
    //ABSTRACTION
    Id: string;
    Priority: number;
    Owner: string;
    Release: (cb: Callback) => any;
}

//Generic Typing
export class Tracker<thing extends Trackable> extends events.EventEmitter {

    private cache: IDic<thing> = {};

    Exist = (port) => {
        return this.cache.hasOwnProperty(port);
    };

    List = () => {
        return this.cache;
    };

    ListByOwner = (owner) => {
        var k = Object.keys(this.cache);
        var o = {};
        for (var i = 0; i < k.length; i++) {
            if (this.cache[k[i]].Owner === owner) {
                o[k[i]] = this.cache[k[i]];
            }
        } return o;
    };

    Get = (id): thing => {
        return this.cache[id];
    };

    Assign = (item: thing, cb) => {
        if (!this.Exist(item.Id)) {
            this.emit("assign", item); 
            this.cache[item.Id] = item;
            //cache[port] = 1;
            return cb(undefined, item);
        }
        else if ((item.Priority <= this.cache[item.Id].Priority && item.Owner !== this.cache[item.Id].Owner)
            || (item.Priority < this.cache[item.Id].Priority && item.Owner == this.cache[item.Id].Owner)) {
            return cb(new Error("Trying to replace an port with equal or higher priority :("));
        }
        else {
            this.Release(item.Id, (err) => {
                if (err) return cb(err);
                this.cache[item.Id] = item;
                return cb(undefined, item);
            });
        }
    };

    Release = (id, cb) => {
        var p = this.cache[id];
        if (!p) return cb(); //good 
        else if (!this.cache[id].Release) {
            return cb(new Error("This port is not removable"));
        }
        else {
            this.cache[id].Release((err, result) => {
                if (err) {
                    return cb(err);
                } else {
                    this.emit("release", p);
                    delete this.cache[id];
                    return cb(); //good
                }
            });
        }
    }

    ReleaseByOwner = (owner, cb) => {
        //try release everything
        var lst = this.ListByOwner(owner);
        async.each(Object.keys(lst), (id, cb) => {
            this.Release(lst, cb);
        }, cb);
    };
}

var slots = {};

export function Register(name, e, f){
    if(typeof f !== "function")
        throw new Error("argument [f] must be a function!");

    slots[name] = slots[name] || {};
    slots[name][e] = slots[name][e] || [];
    slots[name][e].push(f);
}

export function Trigger(name, e, ...args){
    if(slots.hasOwnProperty(name) && slots[name].hasOwnProperty(e)) {
        for(var i in slots[name][e]) {
            slots[name][e][i].apply(undefined, args);
        }
    }
}

//global.Register = Register;
//global.Trigger = Trigger;

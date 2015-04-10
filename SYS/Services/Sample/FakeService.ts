//import events = require('events');
//
//export class FakeService extends events.EventEmitter{
//    constructor(){
//        super();
//    }
//    public FakeA(cb){
//        this.emit('Fake.Up');
//        cb(null, 'FakeService.FakeA()');
//    }
//}
//
//var _service = new FakeService();
//module.exports = _service;

//export function FakeABBB(cb){
//    cb(null, 'FakeService.FakeA()');
//}

export function FakeA(cb){
    this.emit('Fake.Up');
    cb(null, 'FakeService.FakeA()');
}


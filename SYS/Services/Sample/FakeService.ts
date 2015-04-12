import EventsHub = require('../../EventsHub');

export function FakeA(cb){
    __EMIT('Fake.Up', []);
    cb(null, 'FakeService.FakeA()');
}


export function FakeA(cb){
    __EMIT('Fake.Up', []);
    __EMIT('Fake.Down', []);
    cb(null, 'FakeService.FakeA()');
}


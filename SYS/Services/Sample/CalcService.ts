import EventsHub = require('../../EventsHub');

export function Calc(cb) {
    // global api
    (<any>global.api).FakeService.FakeA((err, res) => {
        if (err) error(err);
        cb(null, [res].concat('CalcService.Calc()'));
    });
}

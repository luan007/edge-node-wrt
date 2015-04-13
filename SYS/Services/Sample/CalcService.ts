import EventsHub = require('../../EventsHub');
import APIManager = require('../../APIManager');

export function Calc(cb){
    if(global.rpc) {
        var api = APIManager.GetAPI(global.rpc).API;
        (<any>api).FakeService.FakeA((err, res) => {
            if (err) error(err);
            cb(null, [res].concat('CalcService.Calc()'));
        });
    }
}

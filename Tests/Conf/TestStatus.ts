require('../../System/Env');
import StatMgr = require('../../SYS/Common/Stat/StatMgr');
import _Status = require('../../SYS/Common/Stat/Status');
import Status = _Status.Status;

describe('Status Manager Testing', () => {

    it('pub/sub pattern', (done) => {
        var emitter = StatMgr.Pub('device.status', 'wifi', 'device status transition notification.');  //Service-end

        StatMgr.Sub('device.status', (moduleName, obj) => { // Consumer-end
            obj.should.be.ok;
            moduleName.should.be.eql('wifi');

            done();
        });

        emitter.Emit({'a': 1, 'b': 2}); //Service-end:  Emit overload ver.
    });

    it('pub/sub Buffer pattern', (done) => {
        StatMgr.Sub('holly.crap', (moduleName, obj) => { // Consumer-end
            obj.should.be.ok;
            moduleName.should.be.eql('crap');

            var statuses:any = StatMgr.GetAll();
            statuses.should.be.ok;
            trace('system statuses:', statuses);

            done();
        });

        var emitter = StatMgr.Pub('holly.crap', 'crap', 'just a crap.');  //Service-end

        emitter.Emit({'a': 'ok', 'b': 'yeah'}); //Service-end:  Emit overload ver.
    });
});


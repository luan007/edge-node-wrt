import _Status = require('../System/Conf/Status');
import Status = _Status.Status;
import StatMgr = require('../System/Conf/StatMgr');

describe('Status Manager Testing', () => {

    it('pub/sub pattern', (done) => {

        StatMgr.Sub('device.up', (num1, num2) => {
            num1.should.be.eql(1);
            num2.should.be.eql(2);

            done();
        });

        var emitter = StatMgr.Pub('device.up');
        emitter.Emit(1, 2); // Emit overload ver.
    });
});


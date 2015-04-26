import _Status = require('../System/Conf/Status');
import Status = _Status.Status;
import StatMgr = require('../System/Conf/StatMgr');

describe('Status Manager Testing', () => {

    it('pub/sub pattern', (done) => {

        var emitter = StatMgr.Pub('device.up');  //Service-end

        StatMgr.Sub('device.up', (num1, num2) => { // Consumer-end
            num1.should.be.eql(1);
            num2.should.be.eql(2);

            done();
        });

        emitter.Emit(1, 2); //Service-end:  Emit overload ver.
    });
});


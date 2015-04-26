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

    it('pub/sub Buffer pattern', (done) => {
        StatMgr.Sub('holly.crap', (str1, str2) => { // Consumer-end
            str1.should.be.eql('ok');
            str2.should.be.eql('yeah');

            done();
        });

        var emitter = StatMgr.Pub('holly.crap');  //Service-end

        emitter.Emit('ok', 'yeah'); //Service-end:  Emit overload ver.
    });
});


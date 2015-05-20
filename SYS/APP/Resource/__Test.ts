import AppConfig = require('./AppConfig');
import StatMgr = require('../../Common/Stat/StatMgr');

var appUid = 'testAPP';

function Install() {
    var conf = {
        Hosts: {
            'wi.fi': '192.168.1.1'
        }
    };
    AppConfig.Set(SECTION.NETWORK, appUid, conf, (err)=> {
        if(err) console.log('^______________^ App set failed', err);
        else console.log('^______________^  App set success.');
    });
}

export function Initialize(cb) {
    Install();
    setTask('app_shut', () => {
        AppConfig.Shut(SECTION.NETWORK, appUid, (err)=> {
            if(err) console.log('^______________^ App shut failed', err);
            else console.log('^______________^  App shut success.');
        });
        cb();
    }, 2000);

}

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.RUNTIME);
    sub.on('TestApp', (status)=>{
        console.log('[[[[[[______________]]]]]] TestApp status', status);
    });
    cb();
}

import AppConfig = require('./AppConfig');

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
    setTimeout(() => {
        AppConfig.Dispose(SECTION.NETWORK, appUid, (err)=> {
            if(err) console.log('^______________^ App shut failed', err);
            else console.log('^______________^  App shut success.');
        });
        cb();
    }, 2000);

}

// In network:
//if (has(delta, "testAPP")) {
//    var hosts = delta['testAPP']['Hosts'];
//    dnsmasq.Hosts['testAPP']["wi.fi"] = hosts['wi.fi'];
//}
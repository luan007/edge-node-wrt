import net = require('net');
import dns = require('dns');
import http = require('http');
import StatMgr = require('../../Common/Stat/StatMgr');
import _StatNode = require('../../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;

var pub = StatMgr.Pub(SECTION.CONNECTIVITY, {
    connectivity: {}
});

function _dnsLookup(domain:string, cb:Callback) {
    dns.lookup(domain, <any>must((err) => {
        if (err) {
            pub.connectivity.Set(domain, {
                State: 'error',
                Error: err
            });
            return cb(err);
        }
        else return cb(undefined, {dns: 'OK'});
    }, CONF.PING_CHECK_WAIT_SECONDS * 1000));
}

function _pingJob(domain:string, cb:Callback) {
    exec('ping', '-w', CONF.PING_CHECK_WAIT_SECONDS, '-c', '1', domain, <any>must((err, res)=> {
        if (err) {
            pub.connectivity.Set(domain, {
                State: 'error',
                Error: err
            });
            return cb(err);
        }
        else {
            var ttl = Number.MAX_VALUE;
            var parsed = /(\d+)% packet loss/gmi.exec(res);
            if (parsed && parsed.length > 1) {
                var loss = Number(parsed[1]);
                if (loss < 100) {
                    parsed = /ttl=(\d+)/gmi.exec(res);
                    if (parsed && parsed.length > 1) {
                        ttl = Number(parsed[1]);
                        return cb(undefined, {ttl: ttl, loss: loss});
                    }
                }
            }
            return cb(new Error(domain + ', Loss: 100%.'));
        }
    }, CONF.PING_CHECK_WAIT_SECONDS * 1000));
}

function _fetchHEAD(domain:string, cb:Callback) {
    var options = {
        hostname: domain,
        port: 80,
        path: '/',
        method: 'HEAD'
    };
    http.request(options, must((res)=> {
        return cb(undefined, {statusCode: res.statusCode});
    }, CONF.PING_CHECK_WAIT_SECONDS * 1000)).on('error', (err)=> {
        pub.connectivity.Set(domain, {
            State: 'error',
            Error: err
        });
        return cb(err);
    });
}


function probe(pingCallback:Callback) {
    var jobs = [];
    for (var i = 0, len = CONF.PING_CHECK_DOMAINS.length; i < len; i++) {
        ((_i) => {
            jobs.push((cb) => { // per domain job
                var domain = CONF.PING_CHECK_DOMAINS[_i];
                async.series([
                        (stepCB) => {
                            _dnsLookup(domain, stepCB);
                        },
                        (stepCB) => {
                            _pingJob(domain, stepCB);
                        },
                        (stepCB) => {
                            _fetchHEAD(domain, stepCB);
                        }],
                    (err, results) => {
                        if (err) return cb(err);
                        else return cb(undefined, results);
                    });
            });
        })(i);
    }

    async.series(jobs, (err, results) => { // summarizing
        if (err) return error(err);
        else {
            var res = {};
            for (var i = 0, len = CONF.PING_CHECK_DOMAINS.length; i < len; i++) {
                ((_i) => {
                    var domain = CONF.PING_CHECK_DOMAINS[_i];
                    res[domain] = results[_i];
                })(i);
            }
            pingCallback(undefined, res);
        }
    });
}

function _patrolThread() {
    console.log("Starting Connectivity Patrol Thread - " + (CONF.PING_CHECK_INTERVAL + "").bold["cyanBG"]);
    probe((err, results) => {
        if (err) error('Connectivity patrol error', err);
        else {
            for (var domain in results) {
                pub.connectivity.Set(domain, results[domain]);
            }
        }
    });
}

export function Initialize(cb) {
    setJob("PingService", _patrolThread, CONF.PING_CHECK_INTERVAL);
    cb();
}

global.UntilPingSuccess = function (callback:Callback) {
    var wrapper = untilNoError((cb) => {
        _pingJob(CONF.ORBIT.HOST, cb);
    });
    wrapper(callback);
}
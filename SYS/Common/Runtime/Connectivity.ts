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
    cb = must(cb, CONF.PING_CHECK_WAIT_SECONDS * 1000);
    dns.lookup(domain, (err) => {
        if (err) {
            pub.connectivity.set(domain, {
                State: 'error',
                Error: err
            });
            return cb(err);
        }
        else return cb(undefined, {dns: 'OK'});
    });
}

function _pingJob(domain:string, cb:Callback) {
    cb = must(cb, CONF.PING_CHECK_WAIT_SECONDS * 1000);
    exec('ping', '-w', CONF.PING_CHECK_WAIT_SECONDS, '-c', '1', domain, (err, res)=> {
        if (err) {
            pub.connectivity.set(domain, {
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
    });
}

function _fetchHEAD(domain:string, cb:Callback) {
    cb = must(cb, CONF.PING_CHECK_WAIT_SECONDS * 1000);
    var options = {
        hostname: domain,
        port: 80,
        path: '/',
        method: 'HEAD'
    };
    http.request(options, (res)=> {
        return cb(undefined, {statusCode: res.statusCode});
    }).on('error', (err)=> {
        pub.connectivity.set(domain, {
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
                async.waterfall([
                    (cb) => {
                        _dnsLookup(domain, cb);
                    },
                    (cb) => {
                        _pingJob(domain, cb);
                    },
                    (cb) => {
                        _fetchHEAD(domain, cb);
                    }], (err, results) => {
                    if (err) return cb(err);
                    else return cb(undefined, results);
                });
            });
        })(i);
    }

    async.waterfall(jobs, (err, results) => { // summarizing
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
    console.log("Starting PingService Patrol Thread - " + (CONF.PING_CHECK_INTERVAL + "").bold["cyanBG"]);
    probe((err, results) => {
        if (err) error('Connectivity patrol error', err);
        else {
            for (var domain in results) {
                pub.connectivity.set(domain, results[domain]);
            }
        }
    });
}

export function Initialize(cb) {
    setJob("PingService", _patrolThread, CONF.PING_CHECK_INTERVAL);
    cb();
}

global.UntilPingSuccess = function(callback:Callback) {
    var wrapper = untilNoError((cb) => {
        _pingJob(CONF.ORBIT.HOST, cb);
    });
    wrapper(callback);
}
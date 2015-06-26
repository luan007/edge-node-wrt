import net = require('net');
import dns = require('dns');
import http = require('http');
import Util = require('../Misc/Util');
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
        else return cb(undefined, {time: Util.GetNowDateTimeString(), dns: 'OK'});
    }, CONF.CONNECTIVITY_CHECK_WAIT_SECONDS * 1000));
}

function _pingJob(domain:string, cb:Callback) {
    exec('ping', '-w', CONF.CONNECTIVITY_CHECK_WAIT_SECONDS, '-c', '1', domain, <any>must((err, res)=> {
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
                        return cb(undefined, {time: Util.GetNowDateTimeString(), ttl: ttl, loss: loss});
                    }
                }
            }
            return cb(new Error(domain + ', Loss: 100%.'));
        }
    }, CONF.CONNECTIVITY_CHECK_WAIT_SECONDS * 1000));
}

function _fetchHEAD(domain:string, cb:Callback) {
    var options = {
        hostname: domain,
        port: 80,
        path: '/',
        method: 'HEAD'
    };
    var req = http.request(options, (res)=> {
        return cb(undefined, {time: Util.GetNowDateTimeString(), statusCode: res.statusCode});
    });

    req.on('error', (err)=> {
        pub.connectivity.Set(domain, {
            State: 'error',
            Error: err
        });
        return cb(err);
    });

    req.end();
}


function probe(pingCallback:Callback) {
    var jobs = [];
    for (var i = 0, len = CONF.CONNECTIVITY_CHECK_DOMAINS.length; i < len; i++) {
        ((_i) => {
            jobs.push((cb) => { // per domain job
                var domain = CONF.CONNECTIVITY_CHECK_DOMAINS[_i];
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
            for (var i = 0, len = CONF.CONNECTIVITY_CHECK_DOMAINS.length; i < len; i++) {
                ((_i) => {
                    var domain = CONF.CONNECTIVITY_CHECK_DOMAINS[_i];
                    res[domain] = results[_i];
                })(i);
            }
            pingCallback(undefined, res);
        }
    });
}

function _patrolThread() {
    trace("Starting Connectivity Patrol Thread - " + (CONF.CONNECTIVITY_CHECK_INTERVAL + "").bold["cyanBG"]);
    probe((err, results) => {
        if (err) {
            warn('Connectivity patrol error'['redBG'].bold, err);
        }
        else {
            info('Connectivity patrol result'['cyanBG'].bold, results);
            for (var domain in results) {
                pub.connectivity.Set(domain, results[domain]);
            }
        }
    });
}

export function Initialize(cb) {
    setJob("ConnectivityPatrol", _patrolThread, CONF.CONNECTIVITY_CHECK_INTERVAL);
    cb();
}

global.UntilPingSuccess = function (callback:Callback) {
    var wrapper = untilNoError((cb) => {
        _pingJob(CONF.ORBIT.HOST, cb);
    });
    wrapper(callback);
}
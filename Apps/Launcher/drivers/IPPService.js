var ipp = require('ipp');
var util = require('util');
var fs = require('fs');
var request = require('request');
var conversion = require("phantom-html-to-pdf")();
var PDF_MIME = 'application/pdf';
var OCTET_STREAM = 'application/octet-stream';
var USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36';
var __printers = {}; // deviceId1: {ippUrl, jobs} / deviceId2 : {ippUrl, jobs}
var IPPService = (function () {
    function IPPService() {
        (function (self) {
            setInterval(function () {
                //if (__printers) console.log('----------- printers ', __printers);
                for (var deviceId in __printers) {
                    (function (_deviceId) {
                        var printer = __printers[_deviceId];
                        self.__ippGetJobs(printer.ippUrl, 'completed', function (err, jobs) {
                            if (jobs['job-attributes-tag']) {
                                __printers[_deviceId]['doneJobs'] = jobs['job-attributes-tag'];
                                self.Change(_deviceId, {
                                    attributes: {
                                        "printer.status.doneJobs": __printers[_deviceId]['doneJobs']
                                    }
                                });
                            }
                        });
                        self.__ippGetJobs(printer.ippUrl, 'not-completed', function (err, jobs) {
                            if (jobs['job-attributes-tag']) {
                                __printers[_deviceId]['queue'] = jobs['job-attributes-tag'];
                                self.Change(_deviceId, {
                                    attributes: {
                                        "printer.status.queue": __printers[_deviceId]['queue']
                                    }
                                });
                            }
                        });
                    })(deviceId);
                }
            }, 5 * 35000);
        })(this);
    }
    IPPService.prototype.__ippUrl = function (dev) {
        var ipp = dev.bus.data.MDNS['ipp'];
        if (ipp && ipp.service.port && ipp.service.txtRecord && ipp.service.txtRecord.rp) {
            return util.format('http://%s:%d/%s', dev.bus.data.Lease.Address, ipp.service.port, ipp.service.txtRecord.rp);
        }
        return null;
    };
    IPPService.prototype.__ippPrinter = function (dev) {
        var ippUrl = this.__ippUrl(dev);
        if (ippUrl)
            return ipp.Printer(ippUrl);
        return null;
    };
    IPPService.prototype.__printJobThunk = function (cb) {
        return function (err, res) {
            if (err)
                return cb(err);
            else {
                return cb(undefined, res);
            }
        };
    };
    IPPService.prototype.__detectBufferMime = function (buf, cb) {
        var mmm = require('mmmagic'), Magic = mmm.Magic;
        var magic = new Magic(mmm.MAGIC_MIME_TYPE);
        magic.detect(buf, cb);
    };
    IPPService.prototype.__detectUrlMime = function (uri, cb) {
        var opts = {};
        opts.url = uri;
        opts.method = 'HEAD';
        opts.gzip = opts.gzip || true;
        opts.headers = {
            'User-Agent': USER_AGENT
        };
        request(opts, function (err, response) {
            var mime = (response.headers && response.headers['content-type']) ? response.headers['content-type'] : 'text/plain';
            return cb(err, mime);
        });
    };
    IPPService.prototype.__uri2PDF = function (uri, cb) {
        var opts = {};
        opts.url = uri;
        opts.method = 'GET';
        opts.gzip = opts.gzip || true;
        opts.headers = {
            'User-Agent': USER_AGENT
        };
        request(opts, function (err, response, html) {
            if (err)
                return cb(err);
            conversion({ html: html }, cb);
        });
    };
    IPPService.prototype.__analyzePrinter = function (dev, cb) {
        var _this = this;
        var printer = this.__ippPrinter(dev);
        if (printer) {
            printer.execute("Get-Printer-Attributes", null, function (err, res) {
                if (err) {
                    console.log('Get-Printer-Attributes', err);
                    return cb(err);
                }
                _this.__printerJoin(dev, printer);
                var classes = { 'printer': '' };
                var assump = {};
                var actions = {};
                var printerAttributesTag = res['printer-attributes-tag'];
                if (printerAttributesTag) {
                    if (printerAttributesTag['printer-make-and-model']) {
                        var parts = printerAttributesTag['printer-make-and-model'].split(' ');
                        assump['vendor'] = parts[0];
                        assump['model'] = printerAttributesTag['printer-make-and-model'].replace(assump['vendor'] + ' ', '');
                    }
                    if (printerAttributesTag['ipp-features-supported']) {
                        var executed = /airprint-(.*)/gmi.exec(printerAttributesTag['ipp-features-supported']);
                        if (executed) {
                            assump['printer.airprint'] = true;
                            assump['printer.airprint.version'] = executed[1];
                        }
                    }
                    if (printerAttributesTag['operations-supported']) {
                        for (var k in printerAttributesTag['operations-supported']) {
                            if (/Print-Job|Print-URI/gmi.test(printerAttributesTag['operations-supported'][k])) {
                                actions['print'] = '';
                            }
                            if (/Get-Jobs|Get-Printer-Attributes/gmi.test(printerAttributesTag['operations-supported'][k])) {
                                actions['query'] = '';
                            }
                        }
                    }
                    //var buf = {};
                    for (var key in printerAttributesTag) {
                        var k = 'printer.' + key.toString();
                        assump[k] = printerAttributesTag[key];
                    }
                }
                return cb(null, {
                    classes: classes,
                    actions: actions,
                    aux: {},
                    attributes: assump,
                    valid: true
                });
            });
        }
        else {
            return cb(new Error('unknown device'));
        }
    };
    IPPService.prototype.__printerJoin = function (dev, printer) {
        // job scanning
        //console.log('_________<< __printerJoin', dev.id);
        if (!__printers.hasOwnProperty(dev.id)) {
            __printers[dev.id] = { ippUrl: printer.url.href, queue: {}, doneJobs: {} };
        }
    };
    IPPService.prototype.__ippGetJobs = function (ippUrl, whichJobs, cb) {
        var printer = ipp.Printer(ippUrl);
        var msg = { "operation-attributes-tag": { "limit": 10, 'which-jobs': whichJobs } };
        printer.execute("Get-Jobs", msg, function (err, jobs) {
            //console.log('_____<< Get-Jobs', JSON.stringify(jobs));
            if (err)
                return cb(err);
            return cb(null, jobs);
        });
    };
    IPPService.prototype.__ippGetJobAttributes = function (ippUrl, jobUri, cb) {
        var printer = ipp.Printer(ippUrl);
        var msg = { "operation-attributes-tag": { 'job-uri': jobUri } };
        printer.execute("Get-Job-Attributes", msg, function (err, res) {
            //console.log('_____<< Get-Jobs-Attributes', jobUri, JSON.stringify(res));
            if (err)
                return cb(err);
            return cb(null, res);
        });
    };
    IPPService.prototype.match = function (dev, delta, cb) {
        var ipp = dev.bus.data.MDNS['ipp'];
        if (ipp) {
            console.log("--------------- IPP match Called");
            var matched = ipp.type === 'UP' && ipp.service.addresses && ipp.service.txtRecord;
            return cb(undefined, matched);
        }
        return cb(undefined, false);
    };
    IPPService.prototype.attach = function (dev, delta, matchResult, cb) {
        console.log("--------------- IPP attach Called");
        this.__analyzePrinter(dev, cb);
    };
    IPPService.prototype.change = function (dev, delta, cb) {
        console.log("--------------- IPP change Called");
        this.__analyzePrinter(dev, cb);
    };
    IPPService.prototype.detach = function (dev, delta, cb) {
        delete __printers[dev.id];
        return cb(undefined, true);
    };
    IPPService.prototype.load = function (cb) {
        return cb(undefined, true);
    };
    IPPService.prototype.unload = function (cb) {
        return cb(undefined, true);
    };
    IPPService.prototype.invoke = function (dev, actionId, params, cb) {
        var _this = this;
        var runtimekey = 'App_' + global.runtime_id + ':IPP';
        var assumption = dev.assumptions[runtimekey];
        console.log('IPP action invoke', 'params:', JSON.stringify(params));
        if (assumption['actions'] && assumption['actions'].hasOwnProperty(actionId)) {
            var printer = this.__ippPrinter(dev);
            if (printer) {
                this.__printerJoin(dev, printer);
                if (actionId === 'print') {
                    if (params.fd) {
                        API.IO.ReadFD(params.fd, function (err, fd) {
                            console.log('ReadFD', err, fd);
                            if (err)
                                return cb(err);
                            var bufs = [];
                            var stream = fs.createReadStream('/Share/IO/' + fd);
                            stream.on('data', function (data) {
                                console.log('___________>> read fd data', data.length);
                                bufs.push(data);
                            });
                            stream.on('end', function () {
                                console.log('ipp.invoke close');
                                var data = Buffer.concat(bufs);
                                _this.__detectBufferMime(data, function (err, mime) {
                                    if (err) {
                                        console.log('ipp.invoke mime error', err);
                                        return cb(err);
                                    }
                                    console.log('detected buffer mime', mime);
                                    var supported = assumption['attributes']['printer.document-format-supported'];
                                    if ((Array.isArray(supported) && supported.indexOf(mime) === -1)
                                        || (typeof supported === 'string' && supported !== mime)) {
                                        return console.log('unsupported mime type:', mime);
                                    }
                                    var msg = {
                                        "operation-attributes-tag": {
                                            "requesting-user-name": params.user.name,
                                            "job-name": params.job_name,
                                            "document-format": mime
                                        },
                                        "job-attributes-tag": {
                                            "copies": Number(params.copies),
                                        },
                                        data: data
                                    };
                                    printer.execute("Print-Job", msg, _this.__printJobThunk(function (err, res) {
                                        console.log('Print-Job result', res);
                                    }));
                                });
                            });
                            stream.on('error', function (err) {
                                console.log('ipp.invoke error', err);
                                return cb(err);
                            });
                            return cb();
                        });
                    }
                    else if (params.uri) {
                        var msg = {
                            "operation-attributes-tag": {
                                "requesting-user-name": params.user.name,
                                "job-name": params.job_name,
                                "document-format": PDF_MIME
                            },
                            "job-attributes-tag": {
                                "copies": Number(params.copies),
                            }
                        };
                        this.__detectUrlMime(params.uri, function (err, mime) {
                            if (err)
                                return cb(err);
                            if (mime !== PDF_MIME) {
                                _this.__uri2PDF(params.uri, function (err, pdf) {
                                    console.log('PDF total pages ', pdf.numberOfPages);
                                    var bufs = [];
                                    var stream = pdf.stream;
                                    stream.on('data', function (data) {
                                        bufs.push(data);
                                    });
                                    stream.on('end', function () {
                                        msg['data'] = Buffer.concat(bufs);
                                        printer.execute("Print-Job", msg, this.__printJobThunk(function (err, res) {
                                            console.log('Print-Job result', res);
                                        }));
                                    });
                                    stream.on('error', function (err) {
                                        console.log('received PDF error', err);
                                    });
                                });
                            }
                            else {
                                msg['operation-attributes-tag']['document-uri'] = params.uri;
                                printer.execute("Print-URI", msg, _this.__printJobThunk(function (err, res) {
                                    console.log('Print-Job result', res);
                                }));
                            }
                        });
                        return cb();
                    }
                }
                else if (actionId === 'query') {
                    var ippUrl = printer.url.href;
                    if (params.job_uri) {
                        this.__ippGetJobAttributes(ippUrl, params.job_uri, function (err, jobs) {
                            if (err)
                                return cb(err);
                            var pure = jobs.map(function (job) {
                                delete job.id;
                                return job;
                            });
                            return cb(null, pure);
                        });
                    }
                }
            }
            else {
                return cb(new Error('unknown device'));
            }
        }
        else {
            return cb(new Error('current device does not support the action: ' + actionId));
        }
    };
    return IPPService;
})();
exports.Instance = new IPPService();

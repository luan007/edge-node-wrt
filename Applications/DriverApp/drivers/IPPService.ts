var ipp = require('ipp');
var util = require('util');
var fs = require('fs');
var request:any = require('request');
var conversion = require("phantom-html-to-pdf")();
var PDF_MIME = 'application/pdf';
var OCTET_STREAM = 'application/octet-stream';
var USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36';

class IPPService implements IInAppDriver {
    private __ippUrl(dev:IDevice) {
        var ipp = dev.bus.data.MDNS['ipp'];
        if (ipp && ipp.service.port && ipp.service.txtRecord && ipp.service.txtRecord.rp) {
            return util.format('http://%s:%d/%s', dev.bus.data.Lease.Address
                , ipp.service.port, ipp.service.txtRecord.rp);
        }
        return null;
    }

    private  __ippPrinter(dev) {
        var ippUrl = this.__ippUrl(dev);
        if (ippUrl) return ipp.Printer(ippUrl);
        return null;
    }

    private __ippGetJobs(ippUrl, cb) {
        var printer = ipp.Printer(ippUrl);
        var msg = {"operation-attributes-tag": {}};
        printer.execute("Get-Jobs", msg, function (err, jobs) {
            if (err) return cb(err);
            return cb(null, jobs);
        });
    }

    private __printJobThunk(cb) {
        return (err, res) => {
            if (err) return cb(err);
            else {
                return cb(undefined, res);
            }
        };
    }

    private __printerJoin(dev, printer) {
        // job scanning
        if (!this.__printers[dev.id])
            this.__printers[dev.id] = {ippUrl: printer.url.href, jobs: {}};
    }

    private __detectBufferMime(buf:Buffer, cb) {
        var mmm = require('mmmagic'),
            Magic = mmm.Magic;
        var magic = new Magic(mmm.MAGIC_MIME_TYPE);
        magic.detect(buf, cb);
    }

    private __detectUrlMime(uri:string, cb) {
        var opts:any = {};
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
    }

    private __uri2PDF(uri:string, cb) {
        var opts:any = {};
        opts.url = uri;
        opts.method = 'GET';
        opts.gzip = opts.gzip || true;
        opts.headers = {
            'User-Agent': USER_AGENT
        };
        request(opts, function (err, response, html) {
            if (err) return cb(err);
            conversion({html: html}, cb);
        });
    }

    private __analyzePrinter(dev, cb) {
        var printer = this.__ippPrinter(dev);
        if (printer) {
            printer.execute("Get-Printer-Attributes", null, (err, res) => {
                if (err) {
                    console.log('Get-Printer-Attributes', err);
                    return cb(err);
                }
                //console.log('current device', dev);
                this.__printerJoin(dev, printer);

                var classes:KVSet = {'printer': ''};
                var assump:KVSet = {};
                var actions:KVSet = {};
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
                                break;
                            }
                        }
                    }

                    //var buf = {};
                    for (var key in printerAttributesTag) { // copying
                        var k:any = 'printer.' + key.toString();
                        assump[k] = printerAttributesTag[key];
                        //buf[k] = {'owner': 'printer' };
                        //if(typeof printerAttributesTag[key] !== 'string')
                        //    buf[k]['datatype'] = typeof printerAttributesTag[key];
                    }
                    //fs.writeFile('./Data/printer.schema.json', JSON.stringify(buf), (err)=> {
                    //    if (err) console.log('write printer schema json err', err);
                    //});
                }

                return cb(null, {
                    classes: classes,
                    actions: actions,
                    aux: {},
                    attributes: assump,
                    valid: true
                });
            });
        } else { // should not happen :)
            return cb(new Error('unknown device'));
        }
    }

    constructor() {
        setInterval(this.__jobPatrol, 5 * 1000);
    }

    private __printers:IDic<any> = {};  // deviceId1: {ippUrl, jobs} / deviceId2 : {ippUrl, jobs}
    private __jobPatrol() {
        //console.log('----------- printers ', this.__printers);
        for (var deviceId in this.__printers) {
            ((_deviceId) => {
                var printer = this.__printers[_deviceId];
                this.__ippGetJobs(printer.ippUrl, (err, jobs) => {
                    var doneJobs = delta_add_return_changes(jobs, printer.jobs, false, true);
                    console.log('----------- doneJobs', doneJobs);
                    (<any>this).Change({ // EMIT !!
                        attributes: {
                            "printer.status.doneJobs": doneJobs,
                            "printer.status.queue": jobs
                        }
                    });
                    this.__printers[_deviceId] = jobs;
                });
            })(deviceId);
        }
    }

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        var ipp = dev.bus.data.MDNS['ipp'];
        if (ipp) {
            console.log("--------------- IPP match Called");
            var matched = ipp.type === 'UP' && ipp.service.addresses && ipp.service.txtRecord;
            return cb(undefined, matched);
        }
        return cb(undefined, false);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP attach Called");
        this.__analyzePrinter(dev, cb);
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP change Called");
        this.__analyzePrinter(dev, cb);
    }

    detach(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        delete this.__printers[dev.id];
        return cb(undefined, true);
    }

    load(cb:Callback) {
        return cb(undefined, true);
    }

    unload(cb:Callback) {
        return cb(undefined, true);
    }

    invoke(dev:IDevice, actionId, params, cb) {

        var runtimekey = 'App_' + global.runtime_id + ':IPP';
        var assumption = dev.assumptions[runtimekey];

        console.log('IPP action invoke', 'params:', JSON.stringify(params));

        if (assumption['actions'] && assumption['actions'].hasOwnProperty(actionId)) {
            var printer = this.__ippPrinter(dev);
            if (printer) {

                this.__printerJoin(dev, printer);

                if (params.fd) {
                    API.IO.ReadFD(params.fd, (err, fd)=> {
                        console.log('ReadFD', err, fd);
                        if (err) return cb(err);
                        var bufs = [];
                        var stream = fs.createReadStream('/Share/IO/' + fd);
                        stream.on('data', (data)=> {
                            console.log('___________>> read fd data', data.length);
                            bufs.push(data);
                        });
                        stream.on('end', ()=> {
                            console.log('ipp.invoke close');
                            var data = Buffer.concat(bufs);

                            this.__detectBufferMime(data, (err, mime)=> {
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
                                    }
                                    , "job-attributes-tag": {
                                        "copies": Number(params.copies),
                                    }
                                    , data: data
                                };
                                printer.execute("Print-Job", msg, this.__printJobThunk((err, res)=> {
                                    console.log('Print-Job result', res);
                                }));
                            });
                        });
                        stream.on('error', (err)=> {
                            console.log('ipp.invoke error', err);
                            return cb(err);
                        });
                        return cb();
                    });
                } else if (params.uri) {
                    var msg = {
                        "operation-attributes-tag": {
                            "requesting-user-name": params.user.name,
                            "job-name": params.job_name,
                            "document-format": PDF_MIME
                        }
                        , "job-attributes-tag": {
                            "copies": Number(params.copies),
                        }
                    };
                    this.__detectUrlMime(params.uri, (err, mime)=> {
                        if (err) return cb(err);
                        if (mime !== PDF_MIME) {
                            this.__uri2PDF(params.uri, (err, pdf)=> {
                                console.log('PDF total pages ', pdf.numberOfPages);
                                var bufs = [];
                                var stream:any = pdf.stream;
                                stream.on('data', (data)=> {
                                    bufs.push(data);
                                });
                                stream.on('end', function () {
                                    msg['data'] = Buffer.concat(bufs);
                                    printer.execute("Print-Job", msg, this.__printJobThunk((err, res)=> {
                                        console.log('Print-Job result', res);
                                    }));
                                });
                                stream.on('error', function (err) {
                                    console.log('received PDF error', err);
                                });
                            });
                        } else {
                            msg['operation-attributes-tag']['document-uri'] = params.uri;
                            printer.execute("Print-URI", msg, this.__printJobThunk((err, res)=> {
                                console.log('Print-Job result', res);
                            }));
                        }
                    });
                    return cb();
                }
            } else { // should not happen :)
                return cb(new Error('unknown device'));
            }
        } else {
            return cb(new Error('current device does not support the action: ' + actionId));
        }
    }

}

export var Instance = new IPPService();
var ipp = require('ipp');
var util = require('util');

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

    private __printJobCB(cb) {
        return (err, res) => {
            if (err) return cb(err);
            else {
                console.log('Print-Job result', res);
                return cb(undefined, res);
            }
        };
    }

    constructor() {
        setInterval(this.__jobPatrol, 1 * 1000);
    }

    private __printers:IDic<any> = {};  // deviceId1: {ippUrl, jobs} / deviceId2 : {ippUrl, jobs}
    private __jobPatrol() {
        for (var deviceId in this.__printers) {
            ((_deviceId) => {
                var printer = this.__printers[_deviceId];
                this.__ippGetJobs(printer.ippUrl, (err, jobs) => {
                    var doneJobs = delta_add_return_changes(jobs, printer.jobs, false, true);
                    (<any>this).Change({ // EMIT !!
                        attributes: {
                            "printer.doneJobs": doneJobs,
                            "printer.queue": jobs
                        }
                    });
                    this.__printers[_deviceId] = jobs;
                });
            })(deviceId);
        }
    }

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        var ipp = dev.bus.data.MDNS['ipp'];
        if(ipp) {
            console.log("--------------- IPP match Called");
            var matched = ipp.type === 'UP' && ipp.service.addresses && ipp.service.txtRecord;
            return cb(undefined, matched);
        }
        return cb(undefined, false);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP attach Called");
        cb(undefined, {valid: true});
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP change Called");
        var printer = this.__ippPrinter(dev);
        console.log('printer [1]', printer);
        if (printer) {
            console.log('printer [2]', printer);
            printer.execute("Get-Printer-Attributes", null, (err, res) => {
                console.log('printer [3]', err, res);
                if (err) return cb(err);

                console.log('ipp url.href', printer.url.href);
                // job scanning
                if (!this.__printers[dev.id])
                    this.__printers[dev.id] = {ippUrl: printer.url.href, jobs: {}};

                //TODO: analyze ipp result
                return cb(null, {
                    classes: {'printer': 1},
                    actions: {},
                    aux: {},
                    attributes: res,
                    valid: true
                });
            });
        } else { // should not happen :)
            return cb(new Error('unkown device'));
        }
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
        var printer = this.__ippPrinter(dev);
        if (printer) {
            if (params.fd) {
                //TODO: implement FD API
                API.FD.Read(params.fd, (err, filePath)=> {
                    if (err) return cb(err);
                    fs.readFile(filePath, (err, data)=> {
                        if (err) return cb(err);
                        var msg = {
                            "operation-attributes-tag": {
                                "requesting-user-name": params.user.name,
                                "job-name": params.job_name,
                                "document-format": params.mime_type
                            }
                            , data: data
                        };
                        printer.execute("Print-Job", msg, this.__printJobCB(cb));
                    });
                });
            } else if (params.uri) {
                var msg = {
                    "operation-attributes-tag": {
                        "requesting-user-name": params.user.name,
                        "job-name": params.job_name,
                        "document-format": params.mime_type,
                        "document-uri": params.uri
                    }
                };
                printer.execute("Print-URI", msg, this.__printJobCB(cb));
            }
        } else { // should not happen :)
            return cb(new Error('unknown device'));
        }
    }

}

export var Instance = new IPPService();
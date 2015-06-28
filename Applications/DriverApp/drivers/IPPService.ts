var ipp = require('ipp');
var util = require('util');

class IPPService implements IInAppDriver {
    private __ippUrl(dev:IDevice) {
        var mdnsData = dev.bus.data.MDNS['_ipp._tcp'];
        if (mdnsData.port && mdnsData.txtRecord && mdnsData.txtRecord.rp) {
            return util.format('http://%s:%d/%s', dev.bus.data.Lease.Address
                , mdnsData.port, mdnsData.txtRecord.rp);
        }
        return null;
    }
    private  __ippPrinter(dev) {
        var ippUrl = this.__ippUrl(dev);
        if(ippUrl) return ipp.Printer(ippUrl);
        return null;
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

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        console.log("--------------- IPP match Called", dev.bus.data.MDNS);
        var matched = dev.bus.data.MDNS.type === '_ipp._tcp';
        cb(undefined, matched);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP attach Called");
        cb(undefined, {valid: true});
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- IPP change Called", dev.bus.data.MDNS);
        var printer = this.__ippPrinter(dev);
        if (printer) {
            printer.execute("Get-Printer-Attributes", null, (err, res) => {
                if (err) return cb(err);
                //TODO: analyze ipp result
                return cb(null, {
                    classes: {},
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
                        "requesting-user-name":  params.user.name,
                        "job-name": params.job_name,
                        "document-format": params.mime_type,
                        "document-uri": params.uri
                    }
                };
                printer.execute("Print-URI", msg, this.__printJobCB(cb));
            }
        } else { // should not happen :)
            return cb(new Error('unkown device'));
        }
    }

}

export var Instance = new IPPService();
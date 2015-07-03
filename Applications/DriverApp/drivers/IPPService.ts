var ipp = require('ipp');
var util = require('util');
var fs = require('fs');

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

    private __printerJoin(dev, printer){
        // job scanning
        if (!this.__printers[dev.id])
            this.__printers[dev.id] = {ippUrl: printer.url.href, jobs: {}};
    }

    private __analyzePrinter(dev, cb) {
        var printer = this.__ippPrinter(dev);
        if (printer) {
            printer.execute("Get-Printer-Attributes", null, (err, res) => {
                if (err) {
                    console.log('Get-Printer-Attributes', err);
                    return cb(err);
                }

                this.__printerJoin(dev, printer);

                //TODO: analyze ipp result
                var classes:KVSet = {'printer': ''};
                var assump:KVSet = {};
                var actions:KVSet = {};
                var printerAttributesTag = res['printer-attributes-tag'];
                if (printerAttributesTag) {
                    assump['name'] = printerAttributesTag['printer-name'];
                    if (printerAttributesTag['printer-uri-supported']) {
                        for (var k in printerAttributesTag['printer-uri-supported']) {
                            if (/ipp:/gmi.test(printerAttributesTag['printer-uri-supported'][k]))
                                assump['printer.uri-supported.ipp'] = printerAttributesTag['printer-uri-supported'][k];
                            else if (/ipps:/gmi.test(printerAttributesTag['printer-uri-supported'][k]))
                                assump['printer.uri-supported.ipps'] = printerAttributesTag['printer-uri-supported'][k];
                        }
                    }
                    if (printerAttributesTag['printer-make-and-model']) {
                        var parts = printerAttributesTag['printer-make-and-model'].split(' ');
                        assump['vendor'] = parts[0];
                    }
                    if (printerAttributesTag['printer-info']) {
                        assump['printer.info'] = printerAttributesTag['printer-info'];
                    }
                    if (printerAttributesTag['printer-state']) {
                        assump['printer.status.state'] = printerAttributesTag['printer-state'];
                    }
                    if (printerAttributesTag['printer-icons']) {
                        for (var k in printerAttributesTag['printer-icons']) {
                            if (/large/gmi.test(printerAttributesTag['printer-icons'][k]))
                                assump['printer.icons.large'] = printerAttributesTag['printer-icons'][k];
                            else
                                assump['printer.icons.normal'] = printerAttributesTag['printer-icons'][k];
                        }
                    }
                    if (printerAttributesTag['printer-resolution-default']) {
                        assump['printer.resolution'] = printerAttributesTag['printer-resolution-default'].join(' ');
                    }
                    if (printerAttributesTag['printer-uuid']) {
                        assump['printer.uuid'] = printerAttributesTag['printer-uuid'];
                    }
                    if (printerAttributesTag['ipp-features-supported']) {
                        var executed = /airprint-(.*)/gmi.exec(printerAttributesTag['ipp-features-supported']);
                        if (executed) {
                            assump['printer.airprint'] = true;
                            assump['printer.airprint.version'] = executed[1];
                        }
                    }
                    if (printerAttributesTag['color-supported']) {
                        assump['printer.color.supported'] = printerAttributesTag['color-supported'];
                    }
                    if (printerAttributesTag['document-format-supported']) {
                        for (var k in printerAttributesTag['document-format-supported'])
                            if (/image\/urf/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.image.urf'] = true;
                            else if (/pdf/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.pdf'] = true;
                            else if (/postscript/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.postscript'] = true;
                            else if (/octet-stream/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.octet-stream'] = true;
                            else if (/vnd.hp-PCL/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.vnd.hp-PCL'] = true;
                            else if (/vnd.hp-PCLXL/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.vnd.hp-PCLXL'] = true;
                            else if (/PCLm/gmi.test(printerAttributesTag['document-format-supported'][k]))
                                assump['printer.doc.PCLm'] = true;
                    }
                    if (printerAttributesTag['operations-supported']) {
                        for (var k in printerAttributesTag['operations-supported']) {
                            if (/Print-Job|Print-URI/gmi.test(printerAttributesTag['operations-supported'][k])) {
                                actions['print'] = '';
                                break;
                            }
                        }
                    }
                }
                //console.log('--------------- assump', assump);

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
        setInterval(this.__jobPatrol, 1 * 1000);
    }

    private __printers:IDic<any> = {};  // deviceId1: {ippUrl, jobs} / deviceId2 : {ippUrl, jobs}
    private __jobPatrol() {
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
        var assumption = dev.assumptions['App_DriverApp:IPP'];
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
                        stream.on('data', (data)=>{
                            console.log('print job data length', data.length);
                            bufs.push(data);
                        });
                        stream.on('end', ()=>{
                            console.log('ipp.invoke close');
                            var data = Buffer.concat(bufs);

                            var msg = {
                                "operation-attributes-tag": {
                                    "requesting-user-name": params.user.name,
                                    "job-name": params.job_name,
                                    "document-format": params.mime_type
                                }
                                , data: data
                            };
                            cb();
                            printer.execute("Print-Job", msg, this.__printJobThunk((err, res)=>{
                                console.log('Print-Job result', res);
                            }));
                        });
                        stream.on('error', (err)=>{
                            console.log('ipp.invoke error', err);
                            return cb(err);
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
                    printer.execute("Print-URI", msg, this.__printJobThunk(cb));
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
var lpd = require('lpd');
var util = require('util');
var fs = require('fs');
var path = require('path');
var request:any = require('request');
var fsextra:any = require("fs-extra");
var PDFImagePack:any = require("pdf-image-pack");
var DATA_TMP_DIR = '/Data/tmp';
var PDF_MIME = 'application/pdf';
var USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36';

class LPDService implements IInAppDriver {

    private __analyzePrinter(dev, cb) {
        var printer = dev.bus.data.MDNS['printer'];
        if (printer && printer.type === 'UP' && printer.service.addresses && printer.service.port === 515) {
            var classes:KVSet = {'printer': ''};
            var assump:KVSet = {};
            var actions:KVSet = {'print': ''};

            var printer = dev.bus.data.MDNS['printer'];
            var parts = printer.service.name.split(' ');
            if (parts.length > 1) {
                assump['vendor'] = parts[0];
                assump['model'] = printer.service.name.replace(assump['vendor'] + ' ', '');
            } else {
                assump['model'] = printer.service.name;
            }
            assump["printer.lpd"] = {
                "kind": "LPD"
            };

            return cb(null, {
                classes: classes,
                actions: actions,
                aux: {},
                attributes: assump,
                valid: true
            });
        } else {
            return cb(new Error("Non-LPD device"));
        }
    }

    private __detectBufferMime(buf:Buffer, cb) {
        var mmm = require('mmmagic'),
            Magic = mmm.Magic;
        var magic = new Magic(mmm.MAGIC_MIME_TYPE);
        magic.detect(buf, cb);
    }

    private __blob2PDF(mime, data, cb) {
        if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/gif') { //exception
            var imgFileName = path.join(DATA_TMP_DIR, UUIDstr());
            fs.writeFile(imgFileName, data, (err)=>{
                if(err) return cb(err);
                var pdfFileName = path.join(DATA_TMP_DIR, UUIDstr());
                var opts = {
                    size: 'legal',
                    layout: 'portrait'
                };
                var slide = new PDFImagePack(opts);
                slide.output([imgFileName], pdfFileName, (err2)=>{
                    if(err2) return cb(err2);
                    return cb(undefined, pdfFileName, imgFileName);
                });
            });
        } else {
            return cb(new Error('unsupported mime type: ' + mime));
        }
    }

    private __metaOfLPD(jobName, userName){
        var meta = ["HEdge",
            "Pa",
            "J" + jobName,
            "l" + userName,
            "U" + userName,
            "N" + jobName
        ];
        return new Buffer(meta.join("\n"));
    }

    constructor() {
        if (fs.existsSync(DATA_TMP_DIR))
            fsextra.removeSync(DATA_TMP_DIR);
        if (!fs.existsSync(DATA_TMP_DIR))
            fs.mkdirSync(DATA_TMP_DIR);
    }

    match(dev:IDevice, delta:IDriverDetla, cb:Callback) {
        var printer = dev.bus.data.MDNS['printer'];
        if (printer) {
            console.log("--------------- LPD printer match Called");
            var matched = printer.type === 'UP' && printer.service.addresses && printer.service.port === 515;
            return cb(undefined, matched);
        }
        return cb(undefined, false);
    }

    attach(dev:IDevice, delta:IDriverDetla, matchResult:any, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- LPD attach Called");
        this.__analyzePrinter(dev, cb);
    }

    change(dev:IDevice, delta:IDriverDetla, cb:PCallback<IDeviceAssumption>) {
        console.log("--------------- LPD change Called");
        this.__analyzePrinter(dev, cb);
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
        var runtimekey = 'App_' + global.runtime_id + ':LPD';
        var assumption = dev.assumptions[runtimekey];
        var printer = dev.bus.data.MDNS['printer'];
        if(!printer)
            return cb(new Error("Printer has not online."));

        console.log('LPD action invoke', 'params:', JSON.stringify(params));
        var host = printer.service.addresses;

        if (assumption['actions'] && assumption['actions'].hasOwnProperty(actionId)) {
            if (actionId === 'print') {
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
                            console.log('LPD.invoke close');
                            var data = Buffer.concat(bufs);

                            this.__detectBufferMime(data, (err, mime)=> {
                                var meta = this.__metaOfLPD(params.job_name, params.user ? params.user.name : "Anonymous");
                                if (err) {
                                    console.log('LPD.invoke mime error', err);
                                    return cb(err);
                                }
                                console.log('detected buffer mime', mime);
                                if(mime !== PDF_MIME) {
                                    return this.__blob2PDF(mime, data, (err, pdfFileName, imgFileName)=> {
                                        if (err) return console.log(err);

                                        fs.readFile(pdfFileName, (err2, imgData) => {
                                            if (err2) return console.log(err2);

                                            lpd.sendLPDJob({host:host, controlFile: meta, dataFile:imgData}, (err3)=>{
                                                if(err3) return console.log(err3);
                                                console.log("LPD job DONE.")
                                            });

                                            //clean up
                                            fs.unlink(pdfFileName);
                                            fs.unlink(imgFileName);
                                        });
                                    });
                                } else {
                                    return lpd.sendLPDJob({host:host, controlFile: meta, dataFile:data}, (err3)=>{
                                        if(err3) return console.log(err3);
                                        console.log("LPD job DONE.")
                                    });
                                }
                            });
                        });
                        stream.on('error', (err)=> {
                            console.log('LPD.invoke error', err);
                            return cb(err);
                        });
                        return cb();
                    });
                } else if (params.uri) {
                    return cb(new Error("uri printing has not supported yet."));
                }
            }
        }
    }

}

export var Instance = new LPDService();
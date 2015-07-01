declare var http;
declare var qs;

interface _request {
    (Path: string, Package: any, Callback: PCallback<any>, timeout?: number) : void;
}

class _orbit {

    private appendChecksum = (pkg) => {
        pkg.ts = Date.now();
        pkg.rid = MACHINE.ROUTERID;
        try {
            pkg.ck = Unsafe_SyncRSAEncrypt_Fast("Router", sha256_Obj(pkg));
            return pkg;
        }
        catch (e) {
            error("RSA / CheckSum Error!");
            error(e);
            return undefined;
        }
    };

    PKG = (ticket_atoken, device_id, custom?): KVSet => {
        var pkg = <KVSet>{};
        if (ticket_atoken) {
            pkg["atoken"] = ticket_atoken;
        }
        if (device_id) {
            pkg["did"] = device_id;
        }
        if (custom) {
            for (var i in custom) {
                if (has(custom, i)) {
                    pkg[i] = custom[i];
                }
            }
        }
        return pkg;
    };

    GenericRequest = (_method: string, targetpath, pkg, callback: Callback, timeout = CONF.ORBIT.DEFAULT_TIMEOUT) => {

        pkg = pkg ? pkg : {};

        var retry = callback["retry"];

        callback = must(callback, timeout);

        var headers = {
            'Content-Type': 'application/json'
        };
        if (!this.appendChecksum(pkg)) {
            return callback(new Error("Failed to generate pkg-checksum :("));
        }
        var _qs = (_method == "DEL" || _method == "GET") ? ("?" + qs.stringify(pkg)) : "";
        var _body = (_method == "POST" || _method == "PUT") ? JSON.stringify(pkg) : undefined;

        if (_qs == "" && !_qs && !_body) {
            return callback(new Error("unknown HTTP-Method"), null);
        }

        trace(_method.bold + " > " + targetpath + " " + JSON.stringify(pkg));

        var options = {
            hostname: CONF.ORBIT.HOST,
            port: CONF.ORBIT.PORT,
            path: "/" + targetpath + _qs,
            method: _method,
            headers: headers
        };

        var req = http.request(options, function (res : any) {
            res.setEncoding('utf8');
            var data = "";
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.once('end', function () {
                res.removeAllListeners();
                try {
                    trace(data);
                    var finobj = JSON.parse(data);
                    //INVESTIAGE THIS
                    //if (res.state !== 200) {
                    //    callback(finobj["err"] ? finobj["err"] : new Error(res.state), finobj);
                    //} else {
                        callback(finobj["err"] ? finobj["err"] : undefined, finobj);
                    //}
                } catch (e) {
                    callback(e, null);
                }
            });
            res.once('error', function (err) {
                res.removeAllListeners();
                req.abort();
                callback('Orbit error: \n' + err.message, null); //crashed
            });
        });

        req.once("error", function (err) {
            req.removeAllListeners();
            return callback('Orbit error: \n' +err, null);
            req.abort();
        });
        if (_body) {
            req.write(_body);
        }
        req.end();
    };

    Get: _request = this.GenericRequest.bind(this, "GET");

    Post: _request = this.GenericRequest.bind(this, "POST");

    Delete: _request = this.GenericRequest.bind(this, "DEL");

    Put: _request = this.GenericRequest.bind(this, "PUT");

    Download = (targetpath, pkg, callback: Callback, timeout = CONF.ORBIT.DEFAULT_TIMEOUT) => {
        var _method = "POST";

        pkg = pkg ? pkg : {};

        var retry = callback["retry"];

        callback = must(callback, timeout);

        var headers = {
            'Content-Type': 'application/json'
        };
        if (!this.appendChecksum(pkg)) {
            return callback(new Error("Failed to generate pkg-checksum :("));
        }
        var _body = JSON.stringify(pkg);

        trace(_method.bold + " > " + targetpath + " " + JSON.stringify(pkg));

        var options = {
            hostname: CONF.ORBIT.HOST,
            port: CONF.ORBIT.PORT,
            path: "/" + targetpath,
            method: _method,
            headers: headers
        };

        var req = http.request(options, function (res : any) {
            callback(null, res);
        });

        req.once("error", function (err) {
            req.removeAllListeners();
            return callback(err, null);
            req.abort();
        });
        if (_body) {
            req.write(_body);
        }
        req.end();
    };
}

var Orbit = new _orbit;
global.Orbit = Orbit;
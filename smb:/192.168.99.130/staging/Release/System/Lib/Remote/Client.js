var _orbit = (function () {
    function _orbit() {
        var _this = this;
        this.appendChecksum = function (pkg) {
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
        this.PKG = function (ticket_atoken, device_id, custom) {
            var pkg = {};
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
        this.GenericRequest = function (_method, targetpath, pkg, callback, timeout) {
            if (timeout === void 0) { timeout = CONF.ORBIT.DEFAULT_TIMEOUT; }
            pkg = pkg ? pkg : {};
            var retry = callback["retry"];
            callback = must(callback, timeout);
            var headers = {
                'Content-Type': 'application/json'
            };
            if (!_this.appendChecksum(pkg)) {
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
            var req = http.request(options, function (res) {
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
                        callback(finobj["err"] ? finobj["err"] : undefined, finobj);
                    }
                    catch (e) {
                        callback(e, null);
                    }
                });
                res.once('error', function (err) {
                    res.removeAllListeners();
                    req.abort();
                    callback(err, null);
                });
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
        this.Get = this.GenericRequest.bind(this, "GET");
        this.Post = this.GenericRequest.bind(this, "POST");
        this.Delete = this.GenericRequest.bind(this, "DEL");
        this.Put = this.GenericRequest.bind(this, "PUT");
    }
    return _orbit;
})();
var Orbit = new _orbit;
global.Orbit = Orbit;

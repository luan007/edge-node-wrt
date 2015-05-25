require("./Env");
process.env.ROOT_PATH = __dirname;
process.env.NODE_PATH = __dirname;
global.wait = require("wait.for");
global.async = require("async");
import middlewares = require("./Middlewares");
var connect = require("connect");
var logger = require("morgan");
var bodyParser = require('body-parser');
import express = require("express");

import Data = require("./Storage");

export function Initialize(port, callback:Callback) {

    console.log("Init : " + (port + "")["cyanBG"].bold);

    var SERVER = express();
    global.SERVER = SERVER;

    SERVER.use(logger("dev"));
    SERVER.use(bodyParser.json());
    SERVER.use(bodyParser.urlencoded());

    //SERVER.use(connect.json());
    //SERVER.use(connect.urlencoded());
    //SERVER.use(connect.query());
    //SERVER.use(connect.compress());

    SERVER.use(middlewares.Compatibility);
    SERVER.use(middlewares.RequestFidelity);
    SERVER.use(middlewares.Authentication);
    SERVER.use(middlewares.Device);

    /*workaround for fiber (exception handling)*/
    var trycatch = (what, req, res, next) => {
        wait.launchFiber(() => {
            try {
                what(req, res, next);
            }
            catch (e) {
                next(e);
            }
        });
    };

    global.get = (route, cb:(req, res, next) => any) => {
        console.log("GET " + (route + "").bold);
        SERVER.get(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    global.post = (route, cb) => {
        console.log("POST " + (route + "").bold);
        SERVER.post(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    global.put = (route, cb) => {
        console.log("PUT " + (route + "").bold);
        SERVER.put(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    global.del = (route, cb) => {
        console.log("DEL " + (route + "").bold);
        SERVER.del(route, (req, res, next) => {
            trycatch(cb, req, res, next);
        });
    };

    require("./Services/Device");
    require("./Services/Ticket");
    require("./Services/User");

    SERVER.use(middlewares.ErrorHandler);

    SERVER.listen(port, () => {
        callback(null, true);
        console.log("LISTENING");
    });
}


function InitDB(cb) {
    Data.Initialize("data.db", (err, db) => {
        cb(err, db);
        //    //test router:
        //    //UID: f0dd5972a9fd46a2bf371c7f681fd367
        //    //KEY: 7f17fce09fe543e8badc0b7f72fbc4bba01c2701a849b602d8363a01b2000000b30000006049b6028849b602804ab602202b0000222b0000b4000000b5000000
        //    //SALT: 15e79c28c565a29100b0eca805163531b08ed2f738f4290836c0ed9174861fceb1dff4a0b17cdcfca08e7868bc5d686707b7d774b935e5bb8a29663356965b864360db4cf0eeeeb1c7127a6b6cda768020fb352bc5d6380fbe071fc284dedace85c93eb1dbc2286b5c56d0527465e084531cdb56a4f96059bee1043347cf905ac9ce807d30be1c9d08ad0281bd81d8f756392f214cdde06ff66c7bade63055571dce430eb699326abe50c5599ececd2bc0cf9fe4b85ba6b6ab7f007f38be9a9ee4359bc64267bc905ebdd9198abfda7701ffb102e278e8d1ea1bc97bbb66855490e11ed4100faa23a0b39c87b1b03732a8247df64384d052e88d9c125f1544dac5e99ee84c4af80ddc9e09b4dc82b4e87261284d3d1bfc4f927ad46355a9589aaebcd2428fbb872070dc8e37e97dc1391defffd5be8e17619f40a6cf87aa497188e94b617d0465832339886e7c4ae4ce683bae9dc90d0837edeebd37b2ff3551121496bcb06b51c2371d59e157568c0e69147fef5c61e6ea5f81bf4e768bbbada496e63d54ee525eb11f45cfe0cfea9652c3180bef520b3ee2c623c2d0ee74f4934a08167225fad8d0b4a9adc60867466b098ba40ab5c0ec17f6a177dafa44e5bd7a73f995e656314e55d48bcc7aa30b5da8afc529a2ef9529b98b16693b49c5067453e7890b596f4ba44acff1a53ccaf633124da4fb2bab2b24f9257d554429
        //    //HASHED: 4e759c3fa6c9b495cf1b5dce69bc7e5ef3c3e89922fa61d9a0c21c8be72a2ec44ce5625de0dce3f23665dec3f5347db06f813ae352642ed8235e3e2c0df7ee496ad42682136360a8c0e23235571f2bafc9fb583ad6a4cb122e3db3325ad7b44f31a141c971c4e289c3c4940eae3b4af1410b394a7fbf65ac729b5420831c2beb73aebacf913d5b0923c8145e2798b31ccfd266ca0ed54479369a9c891e616f7f46fc8b14335582dcd319f8defd13c1524a119a52d748ca8a31460cba8232aa3711554d5fca07bc1732c7caad36a778c103b3f187a1969a784b4d04d1ff12573e74fc975ac5eb1d0e0b2da4c4fe49c7ebd89f3bf0c77587145b9c6285d4d682162350ea6f0cfa024f96a86275adc32586488af418d099aa7ea94d3b87014d4831625fdaf4a37980f58ea7955218bbca1dfb77a72a395331ea14f31291b70b4f96a79b0766d1aaaa803e6f4dec0c94b3253ecb4a1f2a258283975d94c28350ca411adadc1efac689d9daa931c446dcf0bf4fadab0cf558484d794004484cbf89490033f1b16f6a35a561a223dc88cab4338e2a8ff07e220a56daa04bd87389098128df2ee2224747187a8dfee564cf45787cf75c1b899ab1b4c6c2687419a33fd59e957f2f951bb5d6d3b464adcaaf407185ea96d15c9dd8317ba5f3d0c62011f8623df98cc69fecc7580efc6f366b1dcf92aa9e4dbdfaaedf57147363304b2a17
        //    var _r = new Data.Router.Router();
        //    _r.uid = "f0dd5972a9fd46a2bf371c7f681fd367";
        //    _r.salt = "15e79c28c565a29100b0eca805163531b08ed2f738f4290836c0ed9174861fceb1dff4a0b17cdcfca08e7868bc5d686707b7d774b935e5bb8a29663356965b864360db4cf0eeeeb1c7127a6b6cda768020fb352bc5d6380fbe071fc284dedace85c93eb1dbc2286b5c56d0527465e084531cdb56a4f96059bee1043347cf905ac9ce807d30be1c9d08ad0281bd81d8f756392f214cdde06ff66c7bade63055571dce430eb699326abe50c5599ececd2bc0cf9fe4b85ba6b6ab7f007f38be9a9ee4359bc64267bc905ebdd9198abfda7701ffb102e278e8d1ea1bc97bbb66855490e11ed4100faa23a0b39c87b1b03732a8247df64384d052e88d9c125f1544dac5e99ee84c4af80ddc9e09b4dc82b4e87261284d3d1bfc4f927ad46355a9589aaebcd2428fbb872070dc8e37e97dc1391defffd5be8e17619f40a6cf87aa497188e94b617d0465832339886e7c4ae4ce683bae9dc90d0837edeebd37b2ff3551121496bcb06b51c2371d59e157568c0e69147fef5c61e6ea5f81bf4e768bbbada496e63d54ee525eb11f45cfe0cfea9652c3180bef520b3ee2c623c2d0ee74f4934a08167225fad8d0b4a9adc60867466b098ba40ab5c0ec17f6a177dafa44e5bd7a73f995e656314e55d48bcc7aa30b5da8afc529a2ef9529b98b16693b49c5067453e7890b596f4ba44acff1a53ccaf633124da4fb2bab2b24f9257d554429";
        //    _r.hashedkey = "4e759c3fa6c9b495cf1b5dce69bc7e5ef3c3e89922fa61d9a0c21c8be72a2ec44ce5625de0dce3f23665dec3f5347db06f813ae352642ed8235e3e2c0df7ee496ad42682136360a8c0e23235571f2bafc9fb583ad6a4cb122e3db3325ad7b44f31a141c971c4e289c3c4940eae3b4af1410b394a7fbf65ac729b5420831c2beb73aebacf913d5b0923c8145e2798b31ccfd266ca0ed54479369a9c891e616f7f46fc8b14335582dcd319f8defd13c1524a119a52d748ca8a31460cba8232aa3711554d5fca07bc1732c7caad36a778c103b3f187a1969a784b4d04d1ff12573e74fc975ac5eb1d0e0b2da4c4fe49c7ebd89f3bf0c77587145b9c6285d4d682162350ea6f0cfa024f96a86275adc32586488af418d099aa7ea94d3b87014d4831625fdaf4a37980f58ea7955218bbca1dfb77a72a395331ea14f31291b70b4f96a79b0766d1aaaa803e6f4dec0c94b3253ecb4a1f2a258283975d94c28350ca411adadc1efac689d9daa931c446dcf0bf4fadab0cf558484d794004484cbf89490033f1b16f6a35a561a223dc88cab4338e2a8ff07e220a56daa04bd87389098128df2ee2224747187a8dfee564cf45787cf75c1b899ab1b4c6c2687419a33fd59e957f2f951bb5d6d3b464adcaaf407185ea96d15c9dd8317ba5f3d0c62011f8623df98cc69fecc7580efc6f366b1dcf92aa9e4dbdfaaedf57147363304b2a17";
        //    Data.Router.Table.count({ uid: _r.uid },(err, val) => {
        //        if (val == 0) {
        //            Data.Router.Table.create(_r,(err, c) => {

        //                Server.Initialize(9999,(err, result) => {
        //                    //
        //                });
        //                Data.Router.Table.get(_r.uid,(err, d) => {
        //                    if (err) {
        //                        warn("Test Data does not exist");
        //                    } else {
        //                        log("Test Router Id:" + d.uid.toString().bold);
        //                    }
        //                });
        //            });
        //        }
        //        else {
        //            Server.Initialize(9999,(err, result) => {
        //                //
        //            });
        //            Data.Router.Table.get(_r.uid,(err, d) => {
        //                if (err) {
        //                    warn("Test Data does not exist");
        //                } else {
        //                    log("Test Router Id:" + d.uid.toString().bold);
        //                }
        //            });
        //        }
        //    });


        //    //auth.Table["findByOwner"]({ email: "xxx@xxx.com" }, (err, q: auth.IAuthTicket[]) => {
        //    //    var x = q[0];
        //    //    console.log(JSON.stringify(x));
        //    //    var o = x.owner;
        //    //    //o.name = "TEST";
        //    //    //o.save({}, (err) => {
        //    //    //    console.log("DONE");
        //    //    //});
        //    //});
        //});
    });
}


function GenerateDummyData(cb) {
    var routerkey = "-----BEGIN RSA PRIVATE KEY-----\n" +
        "MIIBOgIBAAJBAKy3a1HvbB01R8oBz7ulyd3bXn1iYGluOSswkvArRXp + Mosk1XsT\n" +
        "OT3gT9M8M5lsAOX60183if5d4dstUOr2A3cCAwEAAQJARs4u5fkkNlkoZA0YD1Jp\n" +
        "DlWnR / mzkqVINIeGRYVHx24WVAyR36tA53sjgqpa6CM0nZy7eyNPokkOdnF664Ul\n" +
        "yQIhANts8ZTHjjdZzTfWRsvpFm8eFNBMLg2YMRQ1iIb + VXjtAiEAyYFdCRw1AseT\n" +
        "HhtzabRCRtnig6INEh98k98ZwZPSVXMCIHKo3RxHovMdg / U3jUskg8qQx4OJK0 + D\n" +
        "RbIvvyX7ZSKJAiATg9bJyhSMN13VHZ140D9W80UPsIMJjUkYXRP2fmVxZwIhANnI\n" +
        "xXK7lecV / 1vQtXOmeiKFIWf1WIYtWb9dy+ tDoFmG\n" +
        "-----END RSA PRIVATE KEY-----\n";

    var appkey = '-----BEGIN RSA PRIVATE KEY-----\n' +
        'MIIEogIBAAKCAQEAlfnyLpIIpNgNypJdVqf4fkhD1pW8rOHi/r0rNbtqXrVleqyY\n' +
        'qYsFtD51Xiz3ZwzgO81oD826+WLuHTT2uKRXBf/Q/o71/tnwlfAitvMJPcVXVpni\n' +
        'G4g0F7Tsjk/kW8XbXihOmNDrOX9a7k8SNdKvRS23xDDVied+HOYnTt7wSX8sTQdA\n' +
        'V4SIvLZMsfzTE0+e8QQroTGCStk2L446XqokAtw5shMQRG/Q0wEGF2R1y3C8SfQV\n' +
        't3ba8l7DrsjMx+WlGbjj5bXjtat9fTpv65Qbm3p7oH4LqM2KsOPk6vKrwDQpu7HG\n' +
        'h6qF0VZ1WkQouTVU25VlwFWuuE/sojsllBpcsQIDAQABAoIBAGeZ+cph5sa42Q4O\n' +
        'fZvW/Ll/gh1B4swqXnxKgQblKF20QR21DOBRwOb6Hmmn9l+hbWTiR/hizb5osMRM\n' +
        'SgLSw6rJRL4UU6pxMtjgwZpP2RpqsCKKur76H8IgoSjN15nt29P3VBQMffGCIHZu\n' +
        '+M1ldN387u0ALwLMfznHY3AAYUzjDXRlYN7d+cM0q/qnMIlJlSA4Iv4uY9R4YLls\n' +
        'Eotj1QcE5DetujxRG5HDsiB8+9og7gwnG7Qv3D4ebwRWW7xXTV7rBkBEWx//9AIf\n' +
        'Qmz51YMypaZxv535SrezORYo0GB5CaceYdcEvixqKtpIWfVOFOsNF1SSLIUuaMAO\n' +
        'Qj9D8AECgYEA/FOkQJNerKsMtcwngRizejtww80acDltDaFC4k7S+bapI51hlbSf\n' +
        'SkFdVOLj6Vp/ANIty09mSl8VEY0n5PpWRNJFEX5zZHMfKc499F/7e2A7mPtTATyI\n' +
        'k0lqjDBJpp8YeeUpXiv0NPdgTgiFGtjHijI8mdcDAbiTp/E0Z4q9oaECgYEAmCje\n' +
        'yOoEsmX+jOdxpMLdeb70mmno04iOAxa/zv6oy1PhDVL5fH7U3n6kzRfTlJbH+hfj\n' +
        'BHNPCRmVWXMpYxsI9xyQm+sod10s/QqqH9MXxmIxwvj/N2QH79gJeClYmIGjKWQJ\n' +
        'PTdZXkfL83OoDKsjf7I/UHLKr2Z0ID0WeNZBARECgYAZ+RodM445Q9opFHy0gzBm\n' +
        'UpwG66PfDWo2TvUtimOZJL5AVkDnQhJreFL9G+XN7WzJTtk75k5nNWZbyiXjIgmj\n' +
        'R+moJVYHbvo0OXCTKRYf2wYHd0dSB0MfthzrlUTfi9zfH0Gk2e1nTldxcNsSqmHP\n' +
        'zeADDejXUoKQdPmp9tQSQQKBgHDDGRdcFk7/Nz3E53tqzidDVJJ6mojpUhUH7u2/\n' +
        '2+eTKd1t+GZCuA6LXCaB2dLsSxcUTLEnoxLjWsMHjUxc5K/9A04JX9vVuVltZdZf\n' +
        '4earLqWHUdwCzb75I0thmL6sk/ZApHgxZJFyM7sfoxKAYbZoqnM8HukNzFF39Adp\n' +
        'AJOBAoGAXY76d4MV+K0OXvA1L5o/YS+zCbhfipcmLStRwA2LUsWhS6QZCEAdh4fC\n' +
        'O20wSn5ye7WEfzLj/H828fBLe75iI9ehc/XZ4ilEQE1fgv0OaANg7rpoZVnZDssO\n' +
        'FD+fy8Jes0RdVMEij5HfhkBJMViSPZNTurrQvaAGm+1ILbHPJCQ=\n' +
        '-----END RSA PRIVATE KEY-----';

    Data.Models.Router.Table.get("TEST_ROUTER_0", (err, result) => {
        if (!result) {
            var router = new Data.Models.Router.Router();
            router.routerkey = routerkey;
            router.appkey = appkey;
            router.uid = "TEST_ROUTER_0";
            Data.Models.Router.Table.create(router, cb);
        } else {
            cb();
        }
    });
}

async.series([
    InitDB,
    GenerateDummyData,
    Initialize.bind(null, 8080)
], () => {
});
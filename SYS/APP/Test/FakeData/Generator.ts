import _Application = require('../../../DB/Models/Application');
import Application = _Application.Application;
require('../../Remote/Client');

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
    warn("Test - Data Generator Starting..");
    warn(" YOU WILL LOSE DATA!!");
    warn("Now.. Clearing Application Table");

    Application.table().all({}, (err, results)=> {
        if (err) error(err);
        else {
            var jobs = [];
            for (var i = 0, len = results.length; i < len; i++) {
                ((_i) => {
                    jobs.push((cb)=> {
                        console.log(' ============== >>> purge application <<< ', results[_i].uid);
                        results[_i].remove((err)=> {
                            if (err) error(err);
                            cb();
                        });
                    })
                })(i);
            }
            async.series(jobs, ()=> {
                Application.table().create([
                    {
                        uid: CONF.CORE_PARTS["LAUNCHER"],
                        urlName: "",
                        name: "Launcher",
                        appsig: "c26e59366671d116b8bfdedd9a59c38a1ca9570efda4c5fb0cb04816e39c23cba372320fd58107e7fc1459420d838da354ce69580f75e22406f3627e989b7293c8ce73c80185a43c5d06b680c4d646171bf4821c023dbcd860c108f7980a9451d54a4cd21e0cbaad7f342938c3caf5d3573c5472ba4aa9158a464d4d6991b790cd50401088e3e964f5c0ce02779f6879cce8855d238477409d1d408e0dd1bdefc57bfa9aefe28e3dc916e28cb490b725c6ad16864a7cbedeb1d05e2d72f2bb1d842649a883c516e2072eaf5a1e6dda240c171ea12e9354f7f796bd26dc45769dda4dd80eb97ba9b1dc0d1beabf1d9c1514401751b262247f6c89ded0b252cf592b37d05f973dded564a32a3a4d1c242bf7426af3c2f4828b51d798d32cf6b7363454dc42716bb5ff172ffcfd0e28cd1ae973451f26689a5dea9505ed5fce64455b632d69ba70742e119bea14b72a9fac39c4dad049e924e3643329c1788eab1ea23a6582a5ca8c40afe9d2e85829182119bc66e2640bdd7818f4a7dcc4a0dd4672d52a78a4bcbce970db718e232b6f41df1cae135320045181849471b60cf6f845d45ce3f3f52eb509006b78688f22fa252cdfe5e09ca5a021a422ed790db94dfb5d62e5e01852d86311c68d675276c7d5c0606dfe52bbeef3f9dd39dc153b29e2e8c470619a3ff830977063ba3688043d8f24ffa9a47ef479d39323a0981328"
                    }
                ], (err, instance) => {
                    warn("App Data Generated ... ");
                });
            });
        }
    });

    Orbit.Post("User", {name: "mikeluan", email: "1@emerge.cc", password: "1234567890"}, (err, result) => {

    });
});
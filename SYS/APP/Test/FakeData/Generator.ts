import _Application = require('../../../DB/Models/Application');
import Application = _Application.Application;
require('../../Remote/Client');

SYS_ON(SYS_EVENT_TYPE.LOADED, () => {
    warn("Test - Data Generator Starting..");
    warn(" YOU WILL LOSE DATA!!");
    warn("Now.. Clearing Application Table");

    //Application.table().all({}, (err, results)=> {
    //    if (err) error(err);
    //    else {
    //        var jobs = [];
    //        for (var i = 0, len = results.length; i < len; i++) {
    //            ((_i) => {
    //                jobs.push((cb)=> {
    //                    console.log(' ============== >>> purge application <<< ', results[_i].uid);
    //                    results[_i].remove((err)=> {
    //                        if (err) error(err);
    //                        cb();
    //                    });
    //                })
    //            })(i);
    //        }
    //        async.series(jobs, ()=> {
    //            Application.table().create([
    //                {
    //                    uid: CONF.CORE_PARTS["LAUNCHER"],
    //                    urlName: "",
    //                    name: "Launcher",
    //                    appsig: "8ecbc4adce4a3e2e3a161116a3cbe197a25055d12d4f5af76cb6985b17faffdfb57cb8fc5df7ad8fc369ad85e9622c0725819fc4b9be7c023ae8d59395573676a657a8f3e007f7230385208d08765c161a384853c51c69eba5713701142e6cc843124ea9d361a5a486090a8c9dfd7d69d9e944c35af9a6e76ee2e19d50c703f6cfb64627a941231630b6ea397a579efa4e2bef595961bd21d3942da3fd82197bca0c8d2d40e4d2041b43678d1c102cb04f7944dcca26741fe7cfa84e5fcc81b039644fea3efdeb867a33ca8d82012eceba3e1f8c24470e8f6a7af5820f554a0f077ff8da213bafd30cbf65beb73f82d595e29395756acd35d6a096840e3c71f20417f8d6c56a79bccf8902fb468b28284f9593e90de39c7a3ae2c516acaf0007eb212ce3e095f39f25d731d37b89e00d930563d4391b8c89395ddef3e873c0deee4aa8fb5a8ba59fddbb68f14e88119c7ac35995ae27d8401b7868e64364e7c2d57e9f56b4245c94001c2244722b0ca8eb5f48d44514147c81fd9cc686dd5b2728249d4255cfa6257bfa41e3f9ff74add09fe400e8aefad470e9fce911233b86c0a284d8a69dd66e587b31402cecbb36b8d5827cd3de1d76e6e7ccfe0fbca92df8b6215d6c98891f68d49784a95b1cb0c4d838c8e7b61c4c3ba65de64a412fe7961bc2f5a203fdf751aac010e53b28a98cbea23c36d0afebb1add92009a472d6"
    //                }
    //            ], (err, instance) => {
    //                warn("App Data Generated ... ");
    //            });
    //        });
    //    }
    //});

    Orbit.Post("User", {name: "mikeluan", email: "1@emerge.cc", password: "1234567890"}, (err, result) => {

    });
});
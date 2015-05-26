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
                            if(err) error(err);
                            cb();
                        });
                    })
                })(i);
            }
            async.series(jobs, ()=> {
                //Application.table().create([{
                //    uid: "TestApp",
                //    name: "TestApp",
                //    urlName: "TestApp",
                //    appsig: "810f201b90e51d797a87eb87db16062fa50da3d661b7487b9b8b4c8b1eef3b98a54676d9f06b2eb24dbe9272142efa6fb233a03de9b7a00d324b15f547c4cc922034ecf5c6a80602e166e8c316dc40f6b279efeb2ac4bbd7e81de6a5460c4cd28381da755c41109a519597900212d14d4c539e95677c8b9048497cd1e2798aa6cd1c9de34909a261f5ccc320c38a98934be629c1277f73ba143feaa56a08fd3af6c562114e57103912ba0064736c183f325c4c7767ed46f1b0b8784033ea2bf01971deef5dfb219c0aa98f2ab070507ca9f73a46c7041972105d2004303bdf3cf7500de03ab23d2d1d0c30c6139f8645e51299d16c4ba82ca7f4f252bc16974b4927369feec7aa37eb4c7bfe8f55195f6b7de72b50b6b912afaa6246435697e46cb1311a4fb9b43081bf9364bda347c1e9482f56badbb2094e46ebed06e28609b766f17f6e3c45bb4bb6bb4fceb73168d0ecb500b112e8face4ab010138c8040e03d21d1c3a0095b40ae97712b39517c79ea2ddba424234d9cca120726f9a0e44e5919f6c93adb4d299486c767669ebc1a4537ebbb53cf33c800895c5f597e7c9f4cab8f7008d1c524f1d1c1500074a7c8ecfbee438414e6522c7bd0b56414b4c6acf80701d5c69aa40b0402ac7850f65dda511b6900bddb9de9c2a49a7e260a0b7aa033889ace1c6931695a5eb35913ab1dddee9f1fa828726bd8e15c4e1606"
                //}, {
                //    uid: CONF.CORE_PARTS["LAUNCHER"],
                //    urlName: "",
                //    name: "Launcher",
                //    appsig: "875bd3ff5658651f57ddf97db23051318ab95bc599d369a9d9d74cd4a84029b142b8a655571966149cc4a50ead9f96ee70b5f1b73eed33f42a40c4784c3f877b3f23da3780559a1fe01c14d64f6d21e3eb14800f72e83384fb39d2abb01dd9d300b2ef5e6d024f97e544aad6f28aee831a7959bdac73aa4fd213a603342ba62e23dd696eee20adc8500a88e99b424b7a1043bb4b701e8304ef051b895846f58637a00e3b93f1f4f2d6459eab8557f277a7d20fc810042df5eb22e0b2fc3511f649358ff1ed123e9a36c9fdcec98292d2dec2529397255becb4acd3365d536981ed5c2607cdee9675f38b0c3819ef798c16941b4435e6a05befbf9eac738006d30b9f1bbe61c8b7e3f31b77db8380821d392b841a3b3d5005433a5813d40bc50b75f7430177621ce7b087c6924123973f60ed86788f98262d12a5d91ca20685877d0933e054620a466daf13bd7d8c7bb99dfb7417b10b10ea6eda68e20a376196f7dd1addbb89ed40d67cf99c0931809f4e96c11cd006267ef13e62d30fb15ccb1fdf14bf4a64e8fe797a92bb842f418c74ca3d46ca4c10152b8fea2caf0d328ccedf6211cb82b37fdd88f296b5e7f4621f71efdaa93b0845c02466c6be7fde45ebf97878cdb831b6ca6a0ec8dd58f7ed0f004fb356247341006448e68293d91d160a809fb7af672dfc1beddb6dedf02d3de2b3dbc0fc281da6a1fefc24fa9ef7"
                //}
                //], (err, instance) => {
                //    warn("App Data Generated ... ");
                //});
            });
        }
    });

    Orbit.Post("User", {name: "mikeluan", email: "1@emerge.cc", password: "1234567890"}, (err, result) => {

    });
});
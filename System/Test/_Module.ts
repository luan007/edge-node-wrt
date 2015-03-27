exports.Load = function(load_arg: string[], callback: Function) {
    require("./FakeData/Generator");
    //require("./Ports/UnixSocatTest");
    //require("./NGinx/GenericTest");
    //require("./Device/DBTest");
    require("./Deployment/Server");
    require("./CLI");
    callback();
}

export function Initialize()
{
    //global.wait = require("wait.for");
    //log("and Await");
    //global.await = await;
    //log("Binding Sleep");
    //global.sleep = sleep;
    //log("ReqFiber for express/http");
    //global.reqfiber = ReqFiber;
    //good("Fiber Ready");
}

function ReqFiber(req, res, next)
{
    wait.launchFiber(next);
}


function await(func, ...args)
{
    var param = [func];
    var p = param.concat(args);
    wait.for.apply(this, p);
}

function NonBlockSleep(time, callback: Callback) {
    setTimeout(() => {
        callback(null, true);
    }, time);
}

export function sleep(time) {
    wait.for(NonBlockSleep, time);
}

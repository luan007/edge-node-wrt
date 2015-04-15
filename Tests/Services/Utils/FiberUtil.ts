export import Fiber = require('fibers');
export import Future = require('fibers/future');

export function Sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield(1);
}

export function sleepFuture(ms) {
    var future = new Future;
    setTimeout(function() {
        future.return();
    }, ms);
    return future;
}
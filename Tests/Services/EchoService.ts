global.SERVICE = 1;

export function Echo(data, cb) {
    setImmediate(() => {
        cb(undefined,  data);
    });
}
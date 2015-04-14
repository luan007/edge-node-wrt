export function Howl(){
    __EMIT('Huge.Come', '');
    __EMIT('Huge.Go', '');

    var args = [].slice.call(arguments);
    var cb:Function = args.pop();
    cb(null, 'HugeParamsEmitter.Howl()');
}
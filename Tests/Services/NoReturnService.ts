export function Fake(){
    var args = [].slice.call(arguments);
    var cb = args.pop();
    console.log('NoReturnService.Fake received arguments:', args);
}
//network = stateMgr.create('network', { devices: {} }); //optional "default obj" as structure ?
//network.set('internet', true);
//network.internet = true;
//network.internet = {}; //auto watch using Object.observe
//network.internet.blah = true;
//network.internet.blahh = false;
//
/////OR as fallback..es5
//network.set('internet', true);
//network.devices.set('1234567', {/*bleww*/}); //network.devices is initialized during stateMgr.create(.. objSkeleton);
//network.devices.del('1234567');
//
//
//var o = stateMgr.get('network') -> the SAME OBJ?
//
////'helper events'
//    o.on('internet', (old, new)=>{
//    /*only noticed when network.internet is changed*/
//});
//
//o.devices.on('1234567', (old, new)=>{
//    /*only noticed when network.devices.1234567 is changed*/
//});
//
//
////catch alls
//o.devices.on('add', (k, v) => {
//    //new key added
//});
//
//o.devices.on('del', (k, v)=>{
//
//});
//
//o.devices.on('change', (k, v)=>{
//
//});
////end catch all
//
////as for 'o' itself:
//
//o.device.123456 should contain real data
//
//o = {/*your data*/}.extend(eventEmitter);
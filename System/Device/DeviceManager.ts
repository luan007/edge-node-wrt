var devices:IDic<IDevice> = {};

export function DeviceUp(bus:IBusData, state) {
    console.log("device up", arguments);
}

export function DeviceDrop(bus:IBusData) {
    console.log("device drop", arguments);
}

export function RegisterBus(bus) {
    bus.on('device', DeviceUp);
    bus.on('drop', DeviceDrop);
}
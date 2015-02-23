/******THIS FILE IS THE ROOT OF PURE_JS_BASED MODULE DECLARATION******/

///<reference path="node.d.ts"/>
///<reference path="async.d.ts"/>
///<reference path="unix-socket-credentials.d.ts"/>
///<reference path="uuid.d.ts"/>
///<reference path="wait.for.d.ts"/>
///<reference path="express.d.ts"/>
///<reference path="colors.d.ts"/>
///<reference path="sql-query.d.ts"/>
///<reference path="orm.d.ts"/>
///<reference path="restify.d.ts"/>
///<reference path="Q.d.ts"/>
///<reference path="level.d.ts"/>
///<reference path="ipaddrjs.d.ts"/>
///<reference path="nginx-conf.d.ts"/>
///<reference path="underscore.d.ts"/>
///<reference path="validator.d.ts"/>

interface Callback{
    (err?, result?): any;
}

interface PCallback<R>{
    (err, result?: R): any;
}

interface ExecCallback {
    (err, result: { out: string; err: string; }): any;
}

interface IDic<T> {
    [key: string]: T;
}

interface KVSet {
    [key: string]: any;
}

interface Object{
    toString(arg?) : string;
}

/**Device and so on**/

interface IBusData {
    hwaddr?: string;
    data?: any;
    name?: string;
}

interface IDevice {
    assumptions: IDic<IDeviceAssumption>;
    id: string;
    bus: IBusData;
    state: number;
    time: Date;
}

interface IDeviceAssumption {
    driverId?: string;
    classes?: KVSet; //ClassList
    actions?: KVSet;
    attributes?: KVSet;
    valid?: boolean;

    aux?: any;
}

interface IDriver {
    id();
    name();
    status();
    bus(): string[];

    match(dev: IDevice, cb: Callback);
    attach(dev: IDevice, matchResult: any, cb: PCallback<IDeviceAssumption>);

    //TODO: Evaluate if we need "prev" state
    change(dev: IDevice, delta_from_other_driver: IDeviceAssumption, cb: PCallback<IDeviceAssumption>);
    detach(dev: IDevice, cb: PCallback<IDeviceAssumption>);

    load(cb: Callback);
    unload(cb: Callback);

    invoke(dev: IDevice, actionId, params, cb);
}

interface IBus extends NodeJS.EventEmitter {
    name: () => string;
    start: (cb: Callback) => any;
    stop: (cb: Callback) => any;
}

interface IAction {
    //function prototype
    invoke(param, callback);
}

interface IAttribute {
    value: any; //READ ONLY!!!
}

interface IDeviceClass {
    icon: number; //optional
}

interface IDescriptor {
    id: string;
    //name: string;
    desc: string; //lazy?
    tag: string[]; //lazy? search term?
    type: number; //reserved
    owner?: string; //optional?
    level: number;
}

/**
    Regists a function as RPC API, allowing clients (App & NGINX) to call it via RPC entry
    @param func Function to be exposed [ last param must be callback ]
    @param path Remote call path for this function, e.g: "Device.ListAll"
    @param permission Optional, e.g ["SYSTEM", .."], this applies to internal permission manager rather than RPC manager
*/
declare function __API(
    func: Function,
    path: string,
    permission?: Permission[]);


/**
    Regists an RPC Event entry, to be attached from client
    @param path Remote ghost object, e.g "Device.Watcher.error" results to : Device.Watcher.on("error", func);
    @param permission Optional, e.g ["SYSTEM", .."], this applies to internal permission manager rather than RPC manager
*/
declare function __EVENT(
    path: string,
    permission?: Permission[]);


/**
    Triggers client event listener
    @param path Remote ghost object, e.g "Device.Watcher.error" results to : Device.Watcher.on("error", func);
    @param data (param array), applies to remote listener
*/
declare function __EMIT(
    path: string,
    ...data);
///<reference path="./PermissionDef"/>

declare function SenderType(context): string;

declare function SenderId(context): string;


interface API_Socket_Processor {
    (credential: { uid; pid; gid; }, socket, callback: (handled: boolean) => any): any;
}
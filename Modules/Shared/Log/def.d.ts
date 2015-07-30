declare function trace(...args);
declare function debug(...args);
declare function info (...args);
declare function warn (...args);
declare function error(...args);
declare function fatal(...args);

declare function GetLogger(moduleName:string, sw?:boolean);
declare function Turn(moduleName:string, sw?:boolean);
declare function LOG(moduleName:string, sw?:boolean);
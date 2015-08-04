declare enum SYS_EVENT_TYPE {
    LOADED,
    ERROR,
}
declare var SYS_LOADED: boolean;
declare function SYS_ON(name: SYS_EVENT_TYPE, callback: Function);
declare function SYS_REMOVELISTENER(name: SYS_EVENT_TYPE, callback: Function);
declare function SYS_TRIGGER(name: SYS_EVENT_TYPE, ...args);

interface WaitFor {
    launchFiber(func: Function);
    for(func: Function, ...args);
    forMethod(obj, methodName: string, ...args);
}

declare var wait: WaitFor;
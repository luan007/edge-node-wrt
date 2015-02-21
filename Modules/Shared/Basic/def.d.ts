declare var UNCHANGED: any;
declare var DELETED: any;


declare function CJSONString(obj): string;
declare function CJSONParse(str: string): any;

/**
 * Helper Method
 * reflects Object.hasOwnProperty(obj)
 * @param obj Object (which may contain your key)
 * @param key Object[key]
 */
declare function has(obj, key);


/**
 * Helper Method
 * Adds(or overrides) property from [plus] to [o]
 * @param obj Original Object
 * @param plus Delta Object
 * @param override Defaults to TRUE
 */
declare function delta_add(o, plus, override?: boolean): any;

/**
 * Helper Method
 * Modifies property from [mod] to [o]
 * @param obj Original Object
 * @param mod Delta Object
 */
declare function delta_mod(o, mod);


declare function delta_add_return_changes(o, plus, override?: boolean, pretend?: boolean): any;


declare function once(cb: Function): Function;

declare function withdefault(cb: Function, default_val): Function;

declare function ignore_err(cb: Function): Function;

declare function untilNoError(job: (done) => any): Function;

declare function intoQueue(name, job, cb);

declare function must(cb: Function, timeout?, ...defaultargs);


declare function hotswapSafe(name, cb, job: (done) => any);
declare function hotswap(name, _safe_to_swap_now: (done) => any);




declare function setJob(name, job, interval, ...args);
declare function clearJob(name);

declare function setTask(name, job, timeout, ...args);
declare function clearTask(name);

declare function emitterizeCb(_this: any, job, ...args);
declare var UNCHANGED: any;
declare var DELETED: any;

declare function withCb(syncFunc, result?): Function;

declare function CJSONString(obj): string;
declare function CJSONParse(str: string): any;

/**
 * Helper Method
 * reflects Object.hasOwnProperty(obj)
 * @param obj Object (which may contain your key)
 * @param key Object[key]
 */
declare function has(obj, key);

declare function jclone(obj);

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

declare function ignore_if_running(jobName, job: (cb) => any, swallow_cb?, error_if_bypassed?);

declare function retry_times (someJob_with_CB: (cb: (err,result)=>any) => any, max_retry?, delay?);

declare function setJob(name, job, interval, ...args);
declare function clearJob(name);

declare function setTask(name, job, timeout, ...args);
declare function clearTask(name);

declare function setTaskWithCb(name, task: (cb)=>any, timeout, ignoreIfRunning?);
declare function clearTaskWithCb(name);

declare function emitterizeCb(_this: any, job, ...args);



declare function has(obj, key);
declare function dbus_magic(obj);


declare function forEachFlat(arr, job);

declare function mkStruct(base, tree, ignoreErr, cb);

declare function didChange(name, thisTime, comp_func?: (cur, last) => boolean);

declare var Fuzzy: {
	
// The normal entry point. Filters `arr` for matches against `pattern`.
// It returns an array with matching values of the type:
//
//     [{
//         string:   '<b>lah' // The rendered string
//       , index:    2        // The index of the element in `arr`
//       , original: 'blah'   // The original element in `arr`
//     }]
//
// `opts` is an optional argument bag. Details:
//
//    opts = {
//        // string to put before a matching character
//        pre:     '<b>'
//
//        // string to put after matching character
//      , post:    '</b>'
//
//        // Optional function. Input is an entry in the given arr`,
//        // output should be the string to test `pattern` against.
//        // In this example, if `arr = [{crying: 'koala'}]` we would return
//        // 'koala'.
//      , extract: function(arg) { return arg.crying; }
//    }

	filter : (pattern, arr, opts) => any;
	match : (pattern, string, opts) => any;
	test: (pattern, string) => any;
	simpleFilter : (pattern, array) => any;
};
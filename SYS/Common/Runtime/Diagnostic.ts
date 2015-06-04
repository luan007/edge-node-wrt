var fs = require('fs');

var diagnostic_report = [];
var runtime_pool_pids = [];

export function ClearDiagnostic() {
    if (fs.existsSync(CONF.DIAGNOSTIC_PATH))
        fs.unlinkSync(CONF.DIAGNOSTIC_PATH);
}

export function ClearRuntimePID() {
    if (fs.existsSync(CONF.APP_PID_PATH)) {
        var pids = fs.readFileSync(CONF.APP_PID_PATH);
        try {
            pids = JSON.parse(pids);
            for(var i=0,len = pids.length; i<len; i++) {
                console.log('killing -------------- >>', pids[i]);
                exec('kill', '-9', pids[i]);
            }

        } catch(err) { console.log(err); }

        fs.unlinkSync(CONF.APP_PID_PATH);
    }
}

export function ReportSuccess(moduleName) {
    if (diagnostic_report.indexOf(moduleName) === -1)
        diagnostic_report.push(moduleName);

    intoQueue('write_diagnostic', (cb) => {
        fs.writeFile(CONF.DIAGNOSTIC_PATH, diagnostic_report.join('\n'), ()=> {
        });
        cb();
    }, () => {
    });
}

export function ReportRuntimePID(pid) {
    if (runtime_pool_pids.indexOf(pid) === -1)
        runtime_pool_pids.push(pid);

    intoQueue('write_runtimepool_pids', (cb) => {
        fs.writeFile(CONF.APP_PID_PATH, JSON.stringify(runtime_pool_pids), ()=> {
        });
        cb();
    }, () => {
    });
}

global.ClearDiagnostic = ClearDiagnostic;
global.ReportSuccess = ReportSuccess;
global.ClearRuntimePID = ClearRuntimePID;
global.ReportRuntimePID = ReportRuntimePID;


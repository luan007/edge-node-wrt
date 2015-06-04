var fs = require('fs');

var diagnostic_count = 0;
var diagnostic_modules = [];
var runtime_pool_pids = [];

export function ClearDiagnostic() {
    console.log('diagnose cleared.'['magentaBG'].bold);
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

export function RegisterModule(moduleName) {
    if (diagnostic_modules.indexOf(moduleName) === -1)
        diagnostic_modules.push(moduleName);
}

export function ReportModuleSuccess(moduleName) {
    if(diagnostic_modules.indexOf(moduleName) > -1)
        diagnostic_count += 1;

    if(diagnostic_count === diagnostic_modules.length) {
        console.log('diagnose accomplished.'['magentaBG'].bold);
        intoQueue('write_diagnostic', (cb) => {
            fs.writeFile(CONF.DIAGNOSTIC_PATH, '1', ()=> {
            });
            cb();
        }, () => {
        });
    }
}

export function ReportModuleFailed(moduleName) {
    if(diagnostic_modules.indexOf(moduleName) > -1) {
        intoQueue('write_diagnostic', (cb) => {
            fs.writeFile(CONF.DIAGNOSTIC_PATH, '0', ()=> {
            });
            cb();
        }, () => {
        });
    }
}



global.ClearDiagnostic = ClearDiagnostic;
global.RegisterModule = RegisterModule;
global.ReportModuleSuccess = ReportModuleSuccess;
global.ReportModuleFailed = ReportModuleFailed;
global.ClearRuntimePID = ClearRuntimePID;
global.ReportRuntimePID = ReportRuntimePID;


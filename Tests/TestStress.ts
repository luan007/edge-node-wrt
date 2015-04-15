require('colors');
require('../SYS/Env');
import path = require('path');
import moment = require('moment');
import _APIServer = require('../SYS/APIServer');
import APIServer = _APIServer.APIServer;
import _Thread = require('./Services/Utils/Thread');
import FiberUtils = require('./Services/Utils/FiberUtil');
import Thread = _Thread.Thread;

describe('Stress Testing', () => {
    var cfgFileName = 'api.config.json';
    var entry_dir = __dirname;
    var server:APIServer;
    var maxThreads = 3
        , successThreads = 0
        , beginTime;

    before(()=> {
        process.env.apiConfigFilePath = path.join(entry_dir, 'Services/' + cfgFileName);
        process.env.NODE_PATH = entry_dir;
        info('api.config.json path:', process.env.apiConfigFilePath);
        info('process.env.NODE_PATH:', process.env.NODE_PATH);
    });

    beforeEach(function(){
        beginTime = new Date();
        successThreads = 0;
        info('max Threads:', maxThreads);
    })

    it('Concurrent Throughput Probe', (done) => {
        server = new APIServer();

        server.on('loaded', () => {
            info('modules all loaded.');
            var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumers/Concurrent.js');
            var sockPath = server.getSockPath();

            FiberUtils.Fiber(function() {
                for (var i = 0; i < maxThreads; i++) {
                    trace('Spawn consumer: #', i + 1);
                    FiberUtils.Sleep(10); // sleep 2s
                    var thread = new Thread(consumerPath, sockPath);
                    thread.on('SUCCESS', () => { //thread success
                        successThreads += 1;
                        if (successThreads === maxThreads) {
                            server.ShutDown();
                            done();
                        }
                    });
                }
            }).run();
        });
    });


    //it('100 thousands sequential connection', (done) => {
    //    var server = new APIServer();
    //    server.on('loaded', () => {
    //
    //        FiberUtils.Fiber(function() {
    //            info('modules all loaded.');
    //            var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumers/Sequential.js');
    //            var sockPath = server.getSockPath();
    //
    //            for (var i = 0, len = 100 * 1000; i < len; i++) {
    //                trace('Spawn consumer: #', i + 1);
    //                FiberUtils.Sleep(2000); // sleep 2s
    //                new Thread(consumerPath, sockPath);
    //            }
    //
    //            FiberUtils.Sleep(1000); // sleep 1s
    //
    //            server.ShutDown();
    //            done();
    //        }).run();
    //
    //
    //    });
    //});

    afterEach(() => {
        if(successThreads < maxThreads){
            server.ShutDown();
        }
        trace('==================== after testing');
        var milliseconds = moment().diff(beginTime);
        trace('total seconds:', (milliseconds / 1000) >> 0);
        trace('success', successThreads, 'total', maxThreads
            , ((successThreads / maxThreads * 100) >> 0) + '%');
    });
});
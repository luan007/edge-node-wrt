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
    var maxThreads = 1
        , successThreads = 0
        , failedThreads = 0
        , sleepMillSeconds = 0
        , beginTime;

    before(()=> {
        process.env.apiConfigFilePath = path.join(entry_dir, 'Services/' + cfgFileName);
        process.env.NODE_PATH = entry_dir;
        info('api.config.json path:', process.env.apiConfigFilePath);
        info('process.env.NODE_PATH:', process.env.NODE_PATH);
    });

    beforeEach(function () {
        beginTime = new Date();
        successThreads = 0;
        info('max Threads:', maxThreads);
    });

    it.skip('Concurrent Throughput Probe', (done) => {
        var domain = require('domain').create();
        domain.on('error', function (err) {
            error(err);
            error(err.stack);
        });
        domain.run(function () {
            server = new APIServer();

            server.on('loaded', () => {
                info('modules all loaded.');
                var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumers/Concurrent.js');
                var sockPath = server.getSockPath();

                //FiberUtils.Fiber(function () {
                for (var i = 0; i < maxThreads; i++) {
                    trace('Spawn consumer: #', i + 1);

                    process.nextTick(() => {
                        //FiberUtils.Sleep(sleepMillSeconds); // sleep
                        var thread = new Thread(consumerPath, sockPath);
                        thread.on('SUCCESS', () => { //thread success
                            successThreads += 1;
                            if (successThreads === maxThreads) {
                                server.ShutDown();
                                done();
                            }
                        });
                    });
                }
                //}).run();
            });

        });
    });

    it.skip('Complex tasks', (done) => {
        server = new APIServer();

        server.on('loaded', () => {
            info('modules all loaded.');
            var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumers/ComplexTasks.js');
            var sockPath = server.getSockPath();

            var thread = new Thread(consumerPath, sockPath);
            thread.on('SUCCESS', () => { //thread success
                successThreads += 1;
                server.ShutDown();
                done();
            });
            thread.on('FAILED', () => {
                failedThreads += 1;
                server.ShutDown();
                throw new Error('artificial ERROR.');
            });

        });
    });

    it('Sending blob', (done) => {
        server = new APIServer();

        server.on('loaded', () => {
            info('modules all loaded.');
            var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumers/SendBigPacket.js');
            var sockPath = server.getSockPath();

            var thread = new Thread(consumerPath, sockPath);
            thread.on('SUCCESS', () => { //thread success
                successThreads += 1;
                server.ShutDown();
                done();
            });
            thread.on('FAILED', () => {
                failedThreads += 1;
                server.ShutDown();
                throw new Error('artificial ERROR.');
            });

        });
    });

    afterEach(() => {
        if ((successThreads + failedThreads) < maxThreads) {
            server.ShutDown();
        }
        trace('==================== after testing');
        var milliseconds = moment().diff(beginTime);
        trace('total seconds:', (milliseconds / 1000) >> 0);
        trace('success', successThreads, 'failed', failedThreads,  'total', maxThreads
            , ((successThreads / maxThreads * 100) >> 0) + '%');
    });
});
require('colors');
require('../SYS/Env');
import path = require('path');
import _APIServer = require('../SYS/APIServer');
import APIServer = _APIServer.APIServer;
import _Thread = require('./Services/Utils/Thread');
import FiberUtils = require('./Services/Utils/FiberUtil');
import Thread = _Thread.Thread;

describe('load testing', () => {
    var cfgFileName = 'api.config.json';
    var entry_dir = __dirname;

    process.env.apiConfigFilePath = path.join(entry_dir, 'Services/' + cfgFileName);
    //info('api.config.json path:', process.env.apiConfigFilePath);
    process.env.NODE_PATH = entry_dir;
    //info('process.env.NODE_PATH:', entry_dir);

    it('100 thousands client connection', (done) => {
        var server = new APIServer();
        server.on('loaded', () => {

            FiberUtils.Fiber(function() {
                info('modules all loaded.');
                var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumer.js');
                var sockPath = server.getSockPath();

                for (var i = 0, len = 100 * 1000; i < len; i++) {
                    trace('foreach spawn consumer:', i + 1);
                    FiberUtils.Sleep(1000); // sleep 1s
                    new Thread(consumerPath, sockPath);
                }

                FiberUtils.Sleep(1000); // sleep 1s

                done();
            }).run();

        });
    });
});
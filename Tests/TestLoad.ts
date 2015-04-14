require('colors');
require('../SYS/Env');
import path = require('path');
import _APIServer = require('../SYS/APIServer');
import APIServer = _APIServer.APIServer;
import Consumer = require('./Services/Consumer');
import _Thread = require('./Services/Thread');
import Thread = _Thread.Thread;

describe('load testing', () => {
    var cfgFileName = 'api.config.json';
    process.env.apiConfigFilePath = path.join(__dirname, 'Services/' + cfgFileName);
    info('api.config.json path:', process.env.apiConfigFilePath);

    var entry_dir = __dirname;
    process.env.NODE_PATH = entry_dir;
    info('process.env.NODE_PATH:', entry_dir);

    it('1m clients', (done) => {
        var server = new APIServer();
        server.on('loaded', () => {
            info('modules all loaded.');
            var consumerPath = path.join(process.env.NODE_PATH, 'Services/Consumer.js');
            var sockPath = server.getSockPath();

            trace('--------------', consumerPath, sockPath);

            for (var i = 0, len = 1 * 10; i < len; i++) {
                warn('foreach spawn consumer:', i);

                new Thread(consumerPath, sockPath);
            }
            done();
        });
    });
});
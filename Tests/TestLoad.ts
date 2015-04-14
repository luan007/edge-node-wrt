require('colors');
require('../SYS/Env');
import _APIServer = require('../SYS/APIServer');
import APIServer = _APIServer.APIServer;
import Consumer = require('./Services/Consumer');

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

            for (var i = 0, len = 10 * 1000; i < len; i++) {
                Consumer.Initalize(server.getSockPath());
            }
            done();
        });
    });
});
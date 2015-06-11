import AppManager = require('./AppManager');
import StatMgr = require('../Common/Stat/StatMgr');
import _StatNode = require('../Common/Stat/StatNode');
import StatNode = _StatNode.StatNode;

export function Subscribe(cb) {
    var sub = StatMgr.Sub(SECTION.APP);
    sub.apps.on('set', (app_uid, oldValue, status)=> {
        console.log('========[[ APP set'["cyanBG"].bold, status.Error ? status.Error : status.State);
    });
    sub.apps.on('del', (app_uid)=> {
        console.log('========[[ APP delete'["cyanBG"].bold, app_uid);
    });
    cb();
}

export function Initialize(cb) {
    //AppManager.Install('TestApp', (err) => {
    //    if (err) {
    //        error(err);
    //        cb(err);
    //    }
    //    else {
    //        info('Install successfully.');
    //        cb();
    //        //AppManager.UnInstall('DriverApp', (err)=> {
    //        //    if (err) {
    //        //        error(err);
    //        //        cb(err);
    //        //    }
    //        //    else {
    //        //        cb();
    //        //        info('UnInstall successfully.');
    //        //    }
    //        //});
    //    }
    //});
    cb();
}
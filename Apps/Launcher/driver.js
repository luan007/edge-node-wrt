/* global global */
/// <reference path="./global.d.ts" />
var oui = require('./drivers/OUIService');
var p0fService = require('./drivers/P0FService');
var IPPService = require('./drivers/IPPService');
var nameService = require('./drivers/NameService');
global.Drivers = {
    NameService: nameService,
    OUI: oui.Instance,
    P0F: p0fService.Instance,
    IPP: IPPService.Instance
};

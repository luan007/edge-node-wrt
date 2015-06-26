var nameService = require('./drivers/NameService');
var oui = require('./drivers/OUIService');
var p0fService = require('./drivers/P0FService');
var IPPService = require('./drivers/IPPService');

global.Drivers = {
    NameService: nameService.Instance,
    OUI: oui.Instance,
    P0F: p0fService.Instance,
    IPP: IPPService.Instance
};

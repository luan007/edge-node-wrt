var nameService = require('./drivers/NameService');
var oui = require('./drivers/OUIService');

global.Drivers = {
    NameService: nameService.Instance,
    OUI: oui.Instance
};

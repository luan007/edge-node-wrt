var nameService = require('./drivers/NameService');
var oui = require('./drivers/OUI');

global.Drivers = {
    NameService: nameService.Instance,
    OUI: oui.Instance
};

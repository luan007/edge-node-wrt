/* global global */
/// <reference path="./global.d.ts" />
import oui = require('./drivers/OUIService');
import p0fService = require('./drivers/P0FService');
import IPPService = require('./drivers/IPPService');
import nameService = require('./drivers/NameService');
import YeelightService = require('./drivers/YeelightService');
import LPDService = require("./drivers/LPDService");
global.Drivers = {
    NameService: nameService,
    OUI: oui.Instance,
    P0F: p0fService.Instance,
    IPP: IPPService.Instance,
    Yeelight: YeelightService.Instance,
    LPD: LPDService.Instance
};


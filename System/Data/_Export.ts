import orm = require("orm");

export import _app = require("./Models/Application");
export import _testmodel = require("./Models/TestModel");
export import _device = require("./Models/Device");
export import _ticket = require("./Models/Ticket");
export import _user = require("./Models/User");

export import Storage = require("./Storage");

export import Application = _app.Application;
export import TestModel = _testmodel.TestModel;
export import Device = _device.Device;
export import Ticket = _ticket.Ticket;
export import User = _user.User;

export import IApplication = _app.IApplication;
export import ITestModel = _testmodel.ITestModel;
export import IDevice = _device.IDevice;
export import ITicket = _ticket.ITicket;
export import IUser = _user.IUser;

export module Tables {
    export var Application = _app.Application.table;
    export var TestModel = _testmodel.TestModel.table;
    export var Device = _device.Device.table;
    export var Ticket = _ticket.Ticket.table;
    export var User = _user.User.table;
}

export import Registry = require("./Registry");
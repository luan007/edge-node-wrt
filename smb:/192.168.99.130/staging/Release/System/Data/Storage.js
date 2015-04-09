var orm = require("orm");
var fs = require("fs");
var path = require("path");
exports.Database;
function FuncName(func) {
    return func.toString().match(/function (.*)\(/)[1];
}
function Type(obj) {
    var text = Function.prototype.toString.call(obj.constructor);
    return text.match(/function (.*)\(/)[1];
}
function GetDefFromClass(dataclass) {
    var def = {};
    var t = new dataclass();
    for (var typename in t) {
        if (t.hasOwnProperty(typename)) {
            var tname = Type(t[typename]);
            var tfunc = global[tname];
            def[typename] = tfunc;
        }
    }
    return def;
}
function DefineTable(table_name, module_class, options) {
    var def = GetDefFromClass(module_class);
    return exports.Database.define(table_name, def, options);
}
exports.DefineTable = DefineTable;
function Initialize(_db, callback) {
    trace("Init DB");
    orm.connect("sqlite://" + _db, function (err, db) {
        if (!err) {
            trace("[CON] " + _db.cyanBG.bold);
            exports.Database = db;
            LoadModels(callback);
        }
        else {
            error(err, "DB Initialize Failed");
            return callback(err, db);
        }
    });
}
exports.Initialize = Initialize;
function LoadSingleModel(modelName) {
    var model = require("./Models/" + modelName)[modelName];
    var print = ("[" + modelName.toUpperCase() + "]")["magentaBG"].bold;
    model.table();
    var def = GetDefFromClass(model);
    for (var t in def) {
        if (def.hasOwnProperty(t)) {
            var name = t;
            var type = FuncName(def[t]);
            print += " " + name.bold;
        }
    }
    trace(print);
}
function LoadModels(callback) {
    var list = fs.readdirSync(path.join(__dirname, "Models"));
    var modlist = [];
    for (var i = 0; i < list.length; i++) {
        if (list[i].substr(list[i].length - 3).toLowerCase() === ".js" && list[i].charAt(0) !== "_") {
            LoadSingleModel(list[i].substr(0, list[i].length - 3));
        }
    }
    trace("SYNCING"["cyanBG"].bold);
    exports.Database.sync(function (err) {
        if (err) {
            error(err, "ERROR SYNCING DB");
        }
        else {
            trace("UP");
        }
        callback(err, exports.Database);
    });
}

import orm = require("orm");
import fs = require("fs");
import path = require("path");

export import Models = require("./Models/index");

export var Database: orm.ORM;

function FuncName(func) {
    return func.toString().match(/function (.*)\(/)[1];
}

function Type(obj) {
    var text = Function.prototype.toString.call(obj.constructor);
    return text.match(/function (.*)\(/)[1];
}

function GetDefFromClass(dataclass) {
    var def = {};
    var t: Object = new dataclass();

    for (var typename in t) {
        if (t.hasOwnProperty(typename)) {
            var tname = Type(t[typename]);
            var tfunc = global[tname];
            def[typename] = tfunc;
        }
    }
    return def;
}

export function DefineTable(table_name, module_class, options) {

    var def: any = GetDefFromClass(module_class);
    return Database.define(table_name, def, options);

}

export function Initialize(_db, callback: (err, db) => any) {
    console.log("Init DB");
    orm.connect("sqlite://" + _db, (err, db) => {
        if (!err) {
            console.log("[CON] " + _db.cyanBG.bold);
            Database = db;
            LoadModels(callback);
        } else {
            console.log(err);
            return callback(err, db);
        }
    });
}


function LoadSingleModel(modelName: string) {
    var model = require("./Models/" + modelName)[modelName];
    if (!model) {
        return;
    }
    var print = ("[" + modelName.toUpperCase() + "]")["magentaBG"].bold;
    model.table();
    var def = <any>GetDefFromClass(model);
    for (var t in def) {
        if (def.hasOwnProperty(t)) {
            var name = t;
            var type = FuncName(def[t]);
            print += " " + name.bold;
        }
    }
    console.log(print);
}

function LoadModels(callback: (err, db) => any) {

    var list = fs.readdirSync(path.join(__dirname, "Models"));
    var modlist = [];

    for (var i = 0; i < list.length; i++) {
        if (list[i].substr(list[i].length - 3).toLowerCase() === ".js"
            && list[i].charAt(0) !== "_") {
            LoadSingleModel(list[i].substr(0, list[i].length - 3)) + " ";
        }
    }

    console.log("SYNCING"["cyanBG"].bold);
    Database.sync((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("UP");
        }
        callback(err, Database);
    });
}




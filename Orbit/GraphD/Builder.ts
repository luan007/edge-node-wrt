﻿import fs = require('fs');
import path = require('path');

export function Rebuild(cb: Callback) {

    console.log("Rebuilding graphd deltaV database"['greenBG'].bold);

    if(!fs.existsSync(ORBIT_CONF.GRAPHD_CLASSES_LOCATION)) {
        return cb(new Error("graphd classes datafile not found"));
    }
    if(!fs.existsSync(ORBIT_CONF.GRAPHD_ATTRIBUTES_LOCATION)) {
        return cb(new Error("graphd attributes datafile not found"));
    }
    if(!fs.existsSync(ORBIT_CONF.GRAPHD_ACTIONS_LOCATION)) {
        return cb(new Error("graphd actions datafile not found"));
    }

    //TODO: perform File Sig check
    //console.log("Add RSA Check @ GraphD Builder");

    var json = {};
    try {
        var classes = require(ORBIT_CONF.GRAPHD_CLASSES_LOCATION);
        var attributes = require(ORBIT_CONF.GRAPHD_ATTRIBUTES_LOCATION);
        var actions = require(ORBIT_CONF.GRAPHD_ACTIONS_LOCATION);
        json['0'] = classes;
        json['1'] = attributes;
        json['2'] = actions;
    } catch (e) {
        return cb(e);
    }


    var levelQuery:any = require('level-queryengine'),
        jsonqueryEngine:any = require('jsonquery-engine'),
        levelup:any = require('level');

    
    levelup.destroy(ORBIT_CONF.GRAPHD_LOCATION + "_swap", (err, result) => {
        if (err) return cb(err);

        console.log("Old DB destroyed");

        var db = levelQuery(levelup(ORBIT_CONF.GRAPHD_LOCATION + "_swap", { valueEncoding: "json" }));
        db.query.use(jsonqueryEngine());

        db.ensureIndex("name");
        db.ensureIndex("owner");
        db.ensureIndex("tag");
        db.ensureIndex("type");

        var rdb = <LevelUp>db;
        var ws = db.createWriteStream();

        ws.on("close", () => {
            console.log("Done writing");
            cb();
        });
        ws.on("error", (err, result) => {
            //ws.destroy();
            return cb(err, undefined);
        });

        //var type_map = {
        //    "classes": 0,
        //    "attributes": 1,
        //    "actions": 2
        //};

        function levelmark(obj) {
            if (!obj) return 0; //shouldn't happen :p

            //return immediately if already calculated
            if (obj.level + 1 > obj.level /*is number*/) return obj.level; 

            //orphan(not possible) or root
            if (!obj.owner) {
                return obj.level = 0;
            }

            //search for owner
            for (var type in json) {
                if (json[type][obj.owner]) {
                    return obj.level = levelmark(json[type][obj.owner]) + 1; //recur :p, blessings
                }
            }
            return 0; //SHOULD NOT HAPPPPPEN, but.. anyway
        }

        var counter = 0;
        for (var type in json)
        {
            for (var id in json[type]) {
                counter += 1;
                (function (type, id) {
                    process.nextTick(() => { //DO NOT BLOCK !
                        json[type][id].type = Number(type);
                        json[type][id].id = id; //redundancy
                        try {
                            levelmark(json[type][id]); //calculate level
                        }catch(e) {
                            console.log('error'['greenBG'].bold, e, 'type:', type, 'id:', id);
                            throw e;
                        }
                        ws.write(<any>{
                            key: id,
                            value: json[type][id]
                        });
                        counter -= 1;
                        if (counter == 0) {
                            console.log("Flushing into _swap...");
                            ws.end();
                        }
                    });
                })(type, id);
            }
        }

    });
}
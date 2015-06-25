/**
 * Created by luanc_000 on 2015/6/25.
 */

var systemPath = "../../SYS";
var matchAPI = /__(API|EVENT|EMIT)\((.+)\)\s?[;|\n]/gm;
var log = false;
var fs = require('fs'),
    _p = require('path'),
    util = require('util');

var results = {
    API: {},
    EVENT: {},
    EMIT: {}
};

//hooks yea

function extract(path){
    var data = fs.readFileSync(_p.join(systemPath, path)).toString();
    var matches = data.match(matchAPI);
    if(matches) {
        for(var i = 0; i < matches.length; i++) {
            log && console.log(i, matches[i]);
            var cur = matches[i];

            var start = cur.indexOf('(');
            var end = cur.lastIndexOf(')');
            var params = [];
            var c = 0;
            var curstr = "";
            for(var d = start + 1; d < end; d++){
                var char = cur[d];
                if(char === '[' || char === '{' || char === '('){
                    curstr += char;
                    c++;
                } else if(char === ']' || char === '}' || char === ')'){
                    curstr += char;
                    c--;
                } else if(char === "," && c === 0) {
                    params.push(curstr.trim());
                    c = 0;
                    curstr = "";
                } else {
                    curstr += char;
                }
            }
            params.push(curstr.trim());

            if(cur.indexOf('__API') === 0){
                results.API[params[1]] = [ path, params[0], params[2]];
            }
            if(cur.indexOf('__EVENT') === 0){
                results.EVENT[params[0]] = [ path, params[0], params[1]];
            }
            if(cur.indexOf('__EMIT') === 0){
                if(!results.EMIT[params[0]]) { results.EMIT[params[0]] = []; }
                results.EMIT[params[0]].push([ path, params[0], params[1]]);
            }

        }
    }
}

function recurse(p){
    path = _p.join(systemPath, p);
    log && console.log(' > ', p);
    if(fs.statSync(path).isFile()){
        if(path.toLowerCase().indexOf('.ts') == path.length - 3) {
            //parse
            extract(p);
        }
    } else {
        var d = fs.readdirSync(path);
        for(var i = 0; i < d.length; i++){
            recurse(_p.join(p, d[i]));
        }
    }
}


recurse('.');

console.log(JSON.stringify(results));
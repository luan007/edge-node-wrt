//BrandDB search utility

//Note, this works based on a fuzzy search bias, so do try / do-not trust.

//and if it fails, let's take it to the cloud and see..

import path = require("path");
import fs = require("fs");
import http = require('http');

var BASE_PATH = path.join(CONF.RESOURCE_STORE_DIR, '/Symbol');

var brands = {};
//scan through dirs
export function ReloadCache(cb) {
    hotswap("BRAND_DB", (cb) => {
        try{
            var dirs = fs.readdirSync(BASE_PATH);
            for(var i in dirs){
                if(fs.statSync(path.join(BASE_PATH, i)).isDirectory) {
                    brands[i] = fs.readdirSync(path.join(BASE_PATH, i));
                }
            }
            cb();
        } catch(e){
            error("Failed to refresh BrandDB Cache ! ");
            error(e);
            cb(e);
        }
    });
}

export function Brand_Search(brand:string, callback) {
    hotswapSafe("BRAND_DB", callback, (done) => {
        for(var i in brands) {
            var q = Fuzzy.match(i, brand, {});
            console.log(q);
        }
        return "";
    });
}

export function Initialize(cb) {
	ReloadCache((e)=>{
        if(e){
            warn("Warning, Brand DB is not Loaded, will retry soon ");
        }
    });
    cb();
}

__API(Brand_Search, "Resource.SymbolSearch");
﻿"use strict"

var fs = require('fs')
  , ncp = require('ncp').ncp
  , path = require('path')
  , mkdir = require('./mkdir'),
    create = require('./create')

module.exports.copy = copy;
module.exports.copySync = copySync;

var BUF_LENGTH = 64 * 1024
var _buff = new Buffer(BUF_LENGTH)

var copyFileSync = function (srcFile, destFile) {
    var bytesRead, fdr, fdw, pos, stat;
    fdr = fs.openSync(srcFile, 'r');
    stat = fs.fstatSync(fdr);
    fdw = fs.openSync(destFile, 'w', stat.mode);
    bytesRead = 1;
    pos = 0;
    while (bytesRead > 0) {
        bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw, _buff, 0, bytesRead);
        pos += bytesRead;
    }
    fs.closeSync(fdr);
    return fs.closeSync(fdw);
}

function copy(src, dest, filter, callback) {
    if (typeof filter === "function" && !callback) {
        callback = filter;
        filter = null;
    }
    callback = callback || function () { }
    
    fs.lstat(src, function (err, stats) {
        if (err) return callback(err)
        
        var dir = null
        if (stats.isDirectory()) {
            var parts = dest.split(path.sep)
            parts.pop()
            dir = parts.join(path.sep)
        } else {
            dir = path.dirname(dest)
        }
        
        fs.exists(dir, function (dirExists) {
            if (dirExists) return ncp(src, dest, { filter: filter }, callback);
            mkdir.mkdirs(dir, function (err) {
                if (err) return callback(err)
                ncp(src, dest, { filter: filter }, callback);
            })
        })
    })
}

function copySync(src, dest, filter, recursive) {
    filter = filter || function () { return true; };
    recursive = recursive || false;
    var stats = recursive ? fs.lstatSync(src) : fs.statSync(src),
        destFolder = path.dirname(dest),
        destFolderExists = fs.exists(destFolder),
        performCopy = false;
    if (stats.isFile()) {
        if (filter instanceof RegExp) performCopy = filter.test(src);
        else if (typeof filter === "function") performCopy = filter(src);
        if (performCopy) {
            if (!destFolderExists) mkdir.mkdirsSync(destFolder);
            copyFileSync(src, dest);
        }
    }
    else if (stats.isDirectory()) {
        var perform_Action = false;
        if (filter instanceof RegExp) perform_Action = filter.test(src);
        else if (typeof filter === "function") perform_Action = filter(src);
        if (perform_Action) {
            if (!destFolderExists) mkdir.mkdirsSync(dest);
            var contents = fs.readdirSync(src);
            contents.forEach(function (content) {
                copySync(src + "/" + content, dest + "/" + content, filter, true);
            });
        }
    } else if (recursive && stats.isSymbolicLink()) {
        var srcPath = fs.readlinkSync(src);
        fs.symlinkSync(srcPath, dest);
    }
}

//Move this file into fs-extra, and replace it so that this will work
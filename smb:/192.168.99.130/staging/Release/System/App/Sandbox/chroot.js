'use strict';
var fs = require('fs');
var path = require('path');
var posix = require('posix');
module.exports = function chroot(newroot, user, group) {
    if (typeof newroot !== 'string') {
        throw new TypeError('newroot must be a string');
    }
    if (typeof user !== 'string' && typeof user !== 'number') {
        throw new TypeError('user must be a string or a number');
    }
    if (typeof group !== 'undefined') {
        if (typeof group !== 'string' && typeof group !== 'number') {
            throw new TypeError('group must be a string or a number');
        }
    }
    if (newroot.length < 1) {
        throw new Error('newroot must contain at least one character');
    }
    if (typeof user === 'string' && user.length < 1) {
        throw new Error('user must contain at least one character');
    }
    if (user === 'root' || user === 0) {
        throw new Error('new user can not be root or 0');
    }
    if (typeof group !== 'undefined') {
        if (group === 'root' || group === 0) {
            throw new Error('new group can not be root or 0');
        }
    }
    if (process.getuid() !== 0 || posix.geteuid() !== 0) {
        throw new Error('chroot must be called while running as root');
    }
    var pwd;
    try {
        pwd = posix.getpwnam(user);
    }
    catch (err) {
        throw new Error('user not found: ' + user);
    }
    var rpath = fs.realpathSync(newroot);
    var stats;
    do {
        stats = fs.statSync(rpath);
        if (stats.uid !== 0 || (stats.mode & 18) !== 0) {
            throw new Error('bad chroot dir ' + rpath + ' owner: ' + stats.uid + ' or permissions: 0' + stats.mode.toString(8));
        }
        rpath = path.dirname(rpath);
    } while (rpath !== '/');
    try {
        if (typeof group === 'undefined') {
            process.initgroups(pwd.uid, pwd.gid);
        }
        else {
            process.setgroups([group]);
        }
    }
    catch (err) {
        throw new Error('changing groups failed: ' + err.message);
    }
    try {
        posix.chroot(newroot);
    }
    catch (err) {
        throw new Error('changing root failed: ' + err.message);
    }
    process.chdir('/');
    if (typeof process.env.PWD !== 'undefined') {
        process.env.PWD = '/';
    }
    process.setgid(group || pwd.gid);
    process.setuid(pwd.uid);
    try {
        posix.setreuid(-1, 0);
    }
    catch (err) {
        var ids = [process.getuid(), process.getgid(), posix.geteuid(), posix.getegid()];
        Array.prototype.push.apply(ids, process.getgroups());
        if (!~ids.indexOf(0)) {
            return;
        }
    }
    throw new Error('unable to drop privileges');
};

﻿/**
 * Copyright (c) 2014, 2015 Tim Kuijsten
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

var fs = require('fs');
var path = require('path');

var posix = require('posix');

/**
 * Change the root of the current process. A non-superuser must be provided since
 * changing root without dropping privileges makes no sense from a security point
 * of view.
 *
 * @param {String} newroot  the path of the new root for this process. the whole
 *        path should be owned by root and may not be writable by the group or
 *        others
 * @param {String|Number} user  the user name or id to switch to after changing the
 *        root path
 * @param {String|Number} [group]  the group name or id to switch to after changing
 *        the root, defaults to the groups the user is in (using /etc/groups)
 * @throws if any operation fails
 */
module.exports = function chroot(newroot, user, group) {
    if (typeof newroot !== 'string') { throw new TypeError('newroot must be a string'); }
    if (typeof user !== 'string' && typeof user !== 'number') { throw new TypeError('user must be a string or a number'); }
    if (typeof group !== 'undefined') {
        if (typeof group !== 'string' && typeof group !== 'number') { throw new TypeError('group must be a string or a number'); }
    }

    if (newroot.length < 1) { throw new Error('newroot must contain at least one character'); }
    if (typeof user === 'string' && user.length < 1) { throw new Error('user must contain at least one character'); }

    if (user === 'root' || user === 0) { throw new Error('new user can not be root or 0'); }
    if (typeof group !== 'undefined') {
        if (group === 'root' || group === 0) { throw new Error('new group can not be root or 0'); }
    }

    if (process.getuid() !== 0 || posix.geteuid() !== 0) {
        throw new Error('chroot must be called while running as root');
    }

    var pwd;
    try {
        pwd = posix.getpwnam(user);
    } catch (err) {
        throw new Error('user not found: ' + user);
    }

    // check permissions up to the original root of the file system
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
            (<any>process).initgroups(pwd.uid, pwd.gid);
        } else {
            (<any>process).setgroups([group]);
        }
    } catch (err) {
        throw new Error('changing groups failed: ' + err.message);
    }


    try {
        posix.chroot(newroot);
    } catch (err) {
        throw new Error('changing root failed: ' + err.message);
    }
    process.chdir('/');

    // PWD might be set in some environments and is part of POSIX
    if (typeof process.env.PWD !== 'undefined') {
        process.env.PWD = '/';
    }



    process.setgid(group || pwd.gid);
    process.setuid(pwd.uid);

    // try to restore privileges
    try {
        posix.setreuid(-1, 0);
    } catch (err) {
        // double check real and effective ids of the user and group and supplemental groups
        var ids = [process.getuid(), process.getgid(), posix.geteuid(), posix.getegid()];
        Array.prototype.push.apply(ids, (<any>process).getgroups());

        // if none of the ids is zero, privileges are successfully dropped 
        if (!~ids.indexOf(0)) {
            // success
            return;
        }
    }

    throw new Error('unable to drop privileges');
};

/**
 * TODO: add utilities that can help a user in inspecting a designated chroot by
 * checking paths up to the original root for ownership and permissions,
 * environment and open file descriptors.
 *
 * see also:
 * http://www.unixwiz.net/techtips/chroot-practices.html
 * http://www.dwheeler.com/secure-programs/Secure-Programs-HOWTO/minimize-privileges.html
 * http://www.cs.berkeley.edu/~daw/papers/setuid-usenix02.pdf
 * http://www.lst.de/~okir/blackhats/node97.html
 * https://medium.com/@fun_cuddles/opening-files-in-node-js-considered-harmful-d7de566d499f
 * https://github.com/joyent/node/issues/6905
 */

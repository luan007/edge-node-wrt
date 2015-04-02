import Node = require("Node");

export interface OSUser {
    username : string;
    password: string;
    userId: number;
    groupId: number;
    name;
    homedir;
    shell;
};

export function ClearGenerated(cb) {
    List((err, users) => {
        if (err) return cb(err, undefined);
        async.each(users, (u, cb) => {
            if (u.username.length === 32) {
                Delete(u.username, cb);
            } else {
                cb(undefined, {});
            }
        }, cb);
    });
}

export function Create(username, group, shell, cb) {
    var cb = cb || function () { };
    var useraddOpts = [];
    if (group) useraddOpts = useraddOpts.concat(['-G', group]);
    if (shell && shell !== "") useraddOpts = useraddOpts.concat(['-s', shell]);
    else useraddOpts = useraddOpts.concat(['-s', "/dev/null"]);
    //useraddOpts = useraddOpts.concat(['-p', pass]);
    useraddOpts = useraddOpts.concat(['-h', "/nonexistent", "-D"]);
    useraddOpts.push(username);
    var cmd = 'adduser';
    trace("ADD");
    trace(useraddOpts);
    var passwd = Node.child_process.spawn(cmd, useraddOpts);
    passwd.on('exit', function (code, signal) {
        cb(code);
    });
}

export function Delete(username, cb) {
    var cb = cb || function () { };
    var cmd = 'deluser';
    var args = [username];
    var passwd = Node.child_process.spawn(cmd, args);
    passwd.on('exit', function (code, signal) {
        cb(code);
    });
}

export function Get(username, cb: (err, user: OSUser) => any) {
    List(function (err, users) {
        if (err) {
            return cb(err, null);
        }
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            if (user.username == username) {
                cb(undefined, user);
                return;
            }
        };
        cb(undefined, null);
    });
}

export function List(cb: (err, users: OSUser[]) => any){
    Node.fs.readFile('/etc/passwd', function (err, users) {
        if (err) {
            cb(err, undefined);
        } else {
            cb(undefined,
                users
                    .toString()
                    .split('\n')
                    .filter(function (user) {
                        return user.length && user[0] != '#';
                    })
                    .map(function (user) {
                        var fields = user.split(':');
                        return {
                            username: fields[0],
                            password: fields[1],
                            userId: Number(fields[2]),
                            groupId: Number(fields[3]),
                            name: fields[4] ? fields[0] : fields[4],
                            homedir: fields[5],
                            shell: fields[6]
                        }
                    })
                );
        }
    });
}




//this is to make dbus-native a complete lib
//full of magic
global.dbus_magic = function dbus_magic(cur) {
    
    if (!Array.isArray(cur)) {
        return cur;
    }
    else if (cur.length == 2 && Array.isArray(cur[0]) && Array.isArray(cur[1])
        && cur[0][0].type !== undefined 
        && cur[0][0].child !== undefined) {
        return cur[1][0];
    }
    var obj = {};
    for (var i = 0; i < cur.length; i++) {
        obj[cur[i][0]] = dbus_magic(cur[i][1]);
    }
    return obj;

}

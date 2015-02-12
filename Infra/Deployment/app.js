var fs = require("fs-extra"),
    log4js = require("log4js"),
    colors = require("colors"),
    watchr = require('watchr'),
    path = require("path"),
    readline = require("readline-sync"),
    logger = log4js.getLogger("Watcher"),
    os = require("os"),
    child_process = require("child_process");

if (os.platform() == "win32") {
    process.stdout.write('\033c');
} else {
    console.log('\033[2J');
}


log4js.configure({
    appenders: [
        {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: "%[%d{ABSOLUTE} %c%] %m"
            }
        }
    ]
});


var src = path.join(process.cwd() , '../../');
var target = "C:\\TestZone\\System";




var excludes = [
    /\.ts/i,
    /\.git/i,
    /node_modules/i,
    /bin/i,
    /obj/i,
    /Infra/,
    /Include/,
    /RouterOS/,
    /\.d\.ts/i,
    /\.js\.map/i,
    /\.sublime-project/i,
    /\.sublime-workspace/i,
    /\.sln/i,
    /\.suo/i,
    /\.db/i,
    /\.njsproj/i,
    /\.ntvs_analysis\.dat/
];

function filter(file_in) {
    for (var i = 0; i < excludes.length; i++) {
        if (excludes[i].test(file_in)) {
            return false;
        }
    } return true;
}

logger.info("Welcome - Edge Dev Env");

logger.info("\n\n\t\tLooking at \n\t\t" + src.bold 
            + "\n\t\tSync Into \n\t\t" + target.bold 
            + "\n\n\t\t" + "Permit Access via NFS\n".bgGreen.bold);


if (readline.question(" - feel good about all those ? ".magenta.bold + "(Y to proceed) > ".bold) != "Y") { 
    return;
}

logger.info("Syncing..");
fs.copySync(src, target, filter, true);
logger.info("Folder Content Synced :)");

var delay = 300;
var Skip_Visible = false;

watchr.watch({
    paths: [src],
    catchupDelay : delay,
    listeners: {
        error: function (err) {
            //logger.error(err);
        },
        change: function (changeType, filePath, fileCurrentStat, filePreviousStat) {
            //update
            //create
            //delete
            var relative = "\\" + path.relative(src, filePath);
            var targetPath = path.join(target, relative);
            if (!filter(filePath)) {
                if (Skip_Visible) {
                    logger.fatal("<SKIP>" + " ~ " + relative);
                }
                return;
            }
            switch (changeType) {
                case "update":
                    logger.trace("MODIFY".bold + " > " + relative);
                    fs.copySync(filePath, targetPath);
                    break;
                case "create":
                    logger.trace("CREATE".bold + " > " + relative);
                    fs.copySync(filePath, targetPath);
                    break;
                case "delete":
                    logger.error("DELETE".bold + " > " + relative);
                    fs.removeSync(targetPath);
                    break;
            }
        }
    },
    next: function (err, watchers) {
        logger.info("[ WATCHING ] ".bold + "with Catchup_Delay set to " + (delay + "").bold.red);
        if (Skip_Visible) {
            logger.info("[ VERBOSE ] ".bold);
        }
        else {
            logger.info("[ LOG LEVEL = NORMAL ] ".bold);
        }
        
        var proc = child_process.spawn("winnfsd.exe", [target]);
        var t = ("/" + target.replace(":", "").replace(/\\/g, '/'));
        logger.info("[ NFS MOUNTED ] ".bold + t.bold.yellow + "\n <usage>: " + 
         ("mount -o 'vers=3,nolock,tcp' {Machine_Ip}:" + t + " /nfs").bold.cyan);

        if (err) {
            return logger.error(err);
        } else {
        }
    }
});
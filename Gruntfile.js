module.exports = function (grunt) {

    //target folder
    var destination = './_Releases/';
    //var sambaFolder = '//192.168.99.154/Release'; //smb://serbver/folder/
    var sambaFolder = '/Volumes/ROOT/ramdisk/'; //smb://serbver/folder/
    // for grunt-ssh
    var sftpDest = '/ramdisk/';
    //ftp server
    var remoteServer = "http://192.168.99.249:10086/"

    function initGrunt(destination) {
        grunt.initConfig({
            watch: {
                scripts: {
                    files: ['**/*.ts'],
                    tasks: ['ts'],
                    options: {
                        spawn: false
                    }
                }
                , staticFiles: {
                    files: ['**/*.ejs', '**/*.lua', '**/*.css', '**/*.less', '**/*.sh', 'Applications/**/*.*', '!Applications/**/*.ts'],
                    tasks: ['copy', 'sync'],
                    options: {
                        spawn: false
                    }
                }
            }
            , clean: [destination]
            , copy: {
                main: {
                    files: [
                        {expand: true, src: ['Misc/rootDir/*.*'], flatten: true, dest: destination, filter: 'isFile'}
                    ]
                }
            }
            , sync: {
                main: {
                    files: [
                        {src: ['Applications/**/*.*', '!Applications/**/*.ts'], dest: destination},
                        {src: ['Modules/**/*.*', '!Modules/**/*.ts'], dest: destination},
                        {src: ['Orbit/**/*.*', '!Orbit/**/*.ts'], dest: destination},
                        {src: ['System/**/*.*', '!System/**/*.ts'], dest: destination},
                        {src: ['SYS/**/*.*', '!SYS/**/*.ts'], dest: destination},
                        {src: ['Tests/**/*.*', '!Tests/**/*.ts'], dest: destination},
                    ],
                    verbose: true // Display log messages when copying files
                },
                sysonly: {
                    files: [
                        {src: ['SYS/**/*.*', '!SYS/**/*.ts'], dest: destination}
                    ],
                    verbose: true // Display log messages when copying files
                }
            }
            , ts: {
                default: {
                    src: ['**/*.ts', '!node_modules/**/*.ts'],
                    target: 'es5',
                    outDir: destination,
                    options: {
                        fast: "never",
                        module: "commonjs",
                        sourceMap: false,
                        suppressImplicitAnyIndexErrors: true,
                        preserveConstEnums: true
                    }
                }
            }
            , secret: grunt.file.readJSON('secret.json')
            , sftp: {
                entire: {
                    files: {
                        "./": "_Releases/**"
                    },
                    options: {
                        path: sftpDest,
                        host: '<%= secret.host %>',
                        username: '<%= secret.username %>',
                        password: '<%= secret.password %>',
                        showProgress: true,
                        srcBasePath: '_Releases/',
                        createDirectories: true
                    }
                },
                partial: {
                    files: {
                        "./": "_Releases/SYS/**"
                    },
                    options: {
                        path: sftpDest + 'SYS/',
                        host: '<%= secret.host %>',
                        username: '<%= secret.username %>',
                        password: '<%= secret.password %>',
                        showProgress: true,
                        srcBasePath: '_Releases/SYS/',
                        createDirectories: true
                    }
                },
                tests: {
                    files: {
                        "./": "_Releases/Tests/**"
                    },
                    options: {
                        path: sftpDest + 'Tests/',
                        host: '<%= secret.host %>',
                        username: '<%= secret.username %>',
                        password: '<%= secret.password %>',
                        showProgress: true,
                        srcBasePath: '_Releases/Tests/',
                        createDirectories: true
                    }
                }
            }
            , sshexec: {
                chown: {
                    command: 'touch /ramdisk/first_start && chmod 755 /ramdisk/SYS/patrol.sh && chown -R nobody ' + sftpDest + ' && chgrp -R nogroup ' + sftpDest,
                    options: {
                        host: '<%= secret.host %>',
                        username: '<%= secret.username %>',
                        password: '<%= secret.password %>'
                    }
                }
            }
            , shell: {
                clean: {
                    command: 'rm -rf ./_Storage/*.zip',
                    options: {
                        async: false,
                        execOptions: {
                            cwd: './'
                        }
                    }
                }
                , syncDriver: {
                    command: 'cp -rf ./_Releases/Applications/DriverApp/* ./_Storage/Apps/DriverApp/',
                    options: {
                        async: false,
                        execOptions: {
                            cwd: './'
                        }
                    }
                }
                , syncLauncher: {
                    command: 'cp -rf ./_Releases/Applications/Launcher/* ./_Storage/Apps/Launcher/',
                    options: {
                        async: false,
                        execOptions: {
                            cwd: './'
                        }
                    }
                }
                , syncTestApp: {
                    command: 'cp -rf ./_Releases/Applications/TestApp/* ./_Storage/Apps/TestApp/',
                    options: {
                        async: false,
                        execOptions: {
                            cwd: './'
                        }
                    }
                },
                options: {
                    stdout: true,
                    stderr: true,
                    failOnError: true
                }
            }
            , zip: {
                'driverApp': {
                    cwd: './_Storage/Apps/DriverApp/',
                    dest: './_Storage/DriverApp.zip',
                    src: ['./_Storage/Apps/DriverApp/**/*.*']
                }
                , 'Launcher': {
                    cwd: './_Storage/Apps/Launcher/',
                    dest: './_Storage/Launcher.zip',
                    src: ['./_Storage/Apps/Launcher/**/*.*']
                }
                , 'TestApp': {
                    cwd: './_Storage/Apps/TestApp/',
                    dest: './_Storage/TestApp.zip',
                    src: ['./_Storage/Apps/TestApp/**/*.*']
                }
            }
            , http_upload: {
                DriverApp: {
                    options: {
                        url: remoteServer,
                        method: 'POST',
                        rejectUnauthorized: false,
                        onComplete: function (data) {
                            console.log('Response: ' + data);
                        }
                    },
                    src: './_Storage/DriverApp.zip',
                    dest: 'package'
                }
                , Launcher: {
                    options: {
                        url: remoteServer,
                        method: 'POST',
                        rejectUnauthorized: false,
                        onComplete: function (data) {
                            console.log('Response: ' + data);
                        }
                    },
                    src: './_Storage/Launcher.zip',
                    dest: 'package'
                }
                , TestApp: {
                    options: {
                        url: remoteServer,
                        method: 'POST',
                        rejectUnauthorized: false,
                        onComplete: function (data) {
                            console.log('Response: ' + data);
                        }
                    },
                    src: './_Storage/TestApp.zip',
                    dest: 'package'
                }
            }
            , http: {
                unloadDriverApp: {
                    options: {
                        url: remoteServer + 'unload/DriverApp',
                        method: 'GET',
                        callback: function (error, response, body) {
                            console.log(error || 'unload OK.');
                        }
                    }
                }
                , unloadLauncher: {
                    options: {
                        url: remoteServer + 'unload/Launcher',
                        method: 'GET',
                        callback: function (error, response, body) {
                            console.log(error || 'unload OK.');
                        }
                    }
                }
                , unloadTetsApp: {
                    options: {
                        url: remoteServer + 'unload/TetsApp',
                        method: 'GET',
                        callback: function (error, response, body) {
                            console.log(error || 'unload OK.');
                        }
                    }
                }
                , loadDriverApp: {
                    options: {
                        url: remoteServer + 'load/DriverApp',
                        method: 'GET',
                        callback: function (error, response, body) {
                            console.log(error || 'load OK.');
                        }
                    }
                }
                , loadLauncher: {
                    options: {
                        url: remoteServer + 'load/Launcher',
                        method: 'GET',
                        callback: function (error, response, body) {
                            console.log(error || 'load OK.');
                        }
                    }
                }
                , loadTetsApp: {
                    options: {
                        url: remoteServer + 'load/TestApp',
                        method: 'GET',
                        callback: function (error, response, body) {
                            console.log(error || 'load OK.');
                        }
                    }
                }
            }
        });
    }

    initGrunt(destination);
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-ssh");
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-http-upload');
    grunt.loadNpmTasks('grunt-http');
    grunt.loadNpmTasks('grunt-shell-spawn');

    grunt.registerTask("default", ['clean', 'copy', 'sync', 'ts']);
    grunt.registerTask("w", ['clean', 'copy', 'sync', 'ts', 'watch']);
    grunt.registerTask("build", ['copy', 'sync', 'ts']);
    grunt.registerTask("debug", ['sshexec:chown', 'copy', 'sync', 'ts', 'watch']);
    grunt.registerTask("samba", "samba deployment", function () {
        initGrunt(sambaFolder);
        grunt.task.run('debug');
    });
    grunt.registerTask("ftp", ['clean', 'copy', 'sync', 'ts', 'sftp:entire', 'sshexec:chown', 'watch']);
    grunt.registerTask("ftps", ['clean', 'copy', 'sync:sysonly', 'ts', 'sftp:partial', 'sshexec:chown']);
    grunt.registerTask("t", ['sftp:partial', 'sftp:tests', 'sshexec:chown']);

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);

    grunt.registerTask("package", ['clean', 'sync', 'copy', 'ts', 'shell', 'zip']);
    grunt.registerTask("publish", ['http:unloadDriverApp', 'http:unloadLauncher', 'http:unloadTetsApp'
        , 'shell:clean' ,'shell:syncDriver', 'shell:syncLauncher', 'shell:syncTestApp'
        , 'zip:driverApp', 'zip:Launcher', 'zip:TestApp'
        , 'http_upload:DriverApp', 'http_upload:Launcher', 'http_upload:TestApp'
        , 'http:loadDriverApp', 'http:loadLauncher', 'http:loadTetsApp']);
    grunt.registerTask("upload", ['http:unloadDriverApp', 'http:unloadLauncher', 'http:unloadTetsApp'
        , 'http_upload:DriverApp', 'http_upload:Launcher', 'http_upload:TestApp'
        , 'http:loadDriverApp', 'http:loadLauncher', 'http:loadTetsApp']);
    grunt.registerTask("deploy", ['shell', 'zip', 'upload']);
};
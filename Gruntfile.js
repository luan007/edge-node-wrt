module.exports = function (grunt) {

    //target folder
    var destination = './_Releases/';
    //var sambaFolder = '//192.168.99.154/Release'; //smb://serbver/folder/
    var sambaFolder = '/Users/emerge/projects/webstormProjects/Board/ramdisk/'; //smb://serbver/folder/
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
                    files: ['**/*.ejs', '**/*.lua', '**/*.css', '**/*.less', '**/*.sh'],
                    tasks: ['copy', 'sync'],
                    options: {
                        spawn: false
                    }
                }
            }
            , clean: [destination]
            , sync: {
                main: {
                    files: [
                        {src: ['Modules/**/*.*', '!Modules/**/*.ts'], dest: destination},
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

    grunt.registerTask("default", ['clean', 'sync', 'ts']);
    grunt.registerTask("w", ['clean', 'sync', 'ts', 'watch']);
    grunt.registerTask("build", ['sync', 'ts']);
    grunt.registerTask("debug", ['sshexec:chown', 'sync', 'ts', 'watch']);
    grunt.registerTask("samba", "samba deployment", function () {
        initGrunt(sambaFolder);
        grunt.task.run('debug');
    });
    grunt.registerTask("ftp", ['clean', 'copy', 'sync', 'ts', 'sftp:entire', 'sshexec:chown', 'watch']);
    grunt.registerTask("ftps", ['clean', 'copy', 'sync:sysonly', 'ts', 'sftp:partial', 'sshexec:chown']);
    grunt.registerTask("t", ['sftp:partial', 'sftp:tests', 'sshexec:chown']);
};
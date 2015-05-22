module.exports = function (grunt) {

    //target folder
    var destination = './_Releases/';
    //var sambaFolder = '//192.168.99.154/Release'; //smb://serbver/folder/
    var sambaFolder = '/Volumes/staging-4/_Releases'; //smb://serbver/folder/
    // for grunt-ssh
    var sftpDest = '/staging/_Releases/';

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
                    command: 'chown -R nobody ' + sftpDest + ' && chgrp -R nogroup ' + sftpDest,
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

    grunt.registerTask("default", ['clean', 'copy', 'sync', 'ts']);
    grunt.registerTask("w", ['clean', 'copy', 'sync', 'ts', 'watch']);
    grunt.registerTask("build", ['copy', 'sync', 'ts']);
    grunt.registerTask("debug", ['sshexec', 'copy', 'sync', 'ts', 'watch']);
    grunt.registerTask("samba", "samba deployment", function () {
        initGrunt(sambaFolder);
        grunt.task.run('debug');
    });
    grunt.registerTask("ftp", ['clean', 'copy', 'sync', 'ts', 'sftp:entire', 'sshexec', 'watch']);
    grunt.registerTask("t", ['sftp:partial', 'sftp:tests', 'sshexec']);

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);
};
var path = require('path');


module.exports = function (grunt) {

    //DO MODIFY THESE!
    
    var remote_target = "/remote";
    var local_target = "/tmp/test";







    var sysroot = "/ramdisk";
    var approot = "/storage"

    var _syslocal = path.join(local_target, sysroot);
    var _applocal = path.join(local_target, approot);
    function initGrunt(enable_remote){
        
        grunt.initConfig({
            watch: {
                systs: {
                    files: [
                        'GUI/**/*.ts',
                        'Tests/**/*.ts',
                        'SYS/**/*.ts',
                        'Modules/**/*.ts',
                        'typings/**/*.ts',
                    ],
                    tasks: ['ts:sys', 'sync'],
                    options: {
                        spawn: false
                    }
                }
                
                ,appsts: {
                    files: [
                        'Modules/**/*.ts',
                        'typings/**/*.ts',
                        'Apps/**/*.ts'
                    ],
                    tasks: ['ts:app', 'sync'],
                    options: {
                        spawn: false
                    }
                }
                
                , staticFiles: {
                    files: [
                        '**/*.jpg',
                        '**/*.jpeg',
                        '**/*.svg',
                        '**/*.png',
                        '**/*.js',
                        '**/*.lua',
                        '**/*.css',
                        '**/*.less',
                        '**/*.sh',
                        '**/*.woff',
                        '**/*.svg',
                        '**/*.eot',
                        '**/*.html',
                        '**/*.json'
                    ],
                    tasks: ['sync'],
                    options: {
                        spawn: false
                    }
                }
            }
            //, clean: [_syslocal, _applocal]
            , sync: {
                main: {
                    files:  [
                        { src: ['GUI/**/*.*', '!GUI/**/*.ts'], dest: _syslocal },
                        { src: ['Modules/**/*.*', '!Modules/**/*.ts'] , dest: _syslocal },
                        { src: ['SYS/**/*.*', '!SYS/**/*.ts'] , dest: _syslocal },
                        { src: ['Tests/**/*.*', '!Tests/**/*.ts'] , dest: _syslocal },
                        { src: ['Apps/**/*.*', '!Apps/**/*.ts'] , dest: _applocal }
                    ].concat(
                        (!enable_remote) ? [] : [
                            { 
                                cwd: local_target, src: ['**/*.*'], dest: remote_target
                            }
                        ]
                    ),
                    verbose: true // Display log messages when copying files
                },
                
            }
            , ts: {
                sys: {
                    src: ["!Apps/**/*.ts", '**/*.ts', '!node_modules/**/*.ts'],
                    target: 'es5',
                    outDir: _syslocal,
                    options: {
                        fast: "never",
                        module: "commonjs",
                        sourceMap: false,
                        suppressImplicitAnyIndexErrors: true,
                        preserveConstEnums: true
                    }
                },
                app: {
                    src: ['Apps/**/*.ts', '!Apps/**/node_modules/**/*.ts'],
                    target: 'es5',
                    outDir: _applocal,
                    options: {
                        fast: "never",
                        module: "commonjs",
                        sourceMap: false,
                        suppressImplicitAnyIndexErrors: true,
                        preserveConstEnums: true
                    }
                }
            }
        })
    }

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("build", ['sync', 'ts']);
    //grunt.registerTask("samba", "samba deployment", function () {
    //    grunt.task.run('debug');
    //});
    //grunt.registerTask("deploy", "deploy", function () {
    //    grunt.task.run('debug');
    //});
    grunt.registerTask("_run", ['ts', 'sync', 'watch']);
    grunt.registerTask("local", "Deploy to local staging dir", function(){
        initGrunt(false);
        grunt.task.run('_run');
    });
    grunt.registerTask("all", "Deploy to local & remote dir", function(){
        initGrunt(true);
        grunt.task.run('_run');
    });
    grunt.registerTask("default", ['all']);
};
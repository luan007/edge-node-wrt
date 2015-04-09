module.exports = function(grunt) {

    //target folder
    var destination = './_Releases/';
    //var sambaFolder = '//192.168.99.154/Release'; //smb://serbver/folder/
    var sambaFolder = '//192.168.31.149/root/release'; //smb://serbver/folder/

    function initGrunt(destination) {
        grunt.initConfig({
            watch: {
                scripts: {
                    files: ['**/*.ts'],
                    tasks: ['ts'],
                    options: {
                        spawn: false
                    }
                },
                staticFiles: {
                    files: ['**/*.ejs', '**/*.lua', '**/*.css', '**/*.less', 'Applications/**/*.*', '!Applications/**/*.ts'],
                    tasks: ['copy', 'sync'],
                    options: {
                        spawn: false
                    }
                }
            },
            clean: [destination],
            copy: {
                main: {
                    files: [
                        {expand: true, src: ['Misc/rootDir/*.*'], flatten: true, dest: destination, filter: 'isFile'}
                    ]
                }
            },
            sync: {
                main: {
                    files: [
                        {src: ['Applications/**/*.*', '!Applications/**/*.ts'], dest: destination},
                        {src: ['Modules/**/*.*', '!Modules/**/*.ts'], dest: destination},
                        {src: ['Orbit/**/*.*', '!Orbit/**/*.ts'], dest: destination},
                        {src: ['System/**/*.*', '!System/**/*.ts'], dest: destination},
                        {src: ['SYS/**/*.*', '!SYS/**/*.ts'], dest: destination},
                    ],
                    verbose: true // Display log messages when copying files
                }
            },
            ts: {
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
        });
    }
    initGrunt(destination);
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");

    grunt.registerTask("default", ['clean', 'copy', 'sync', 'ts']);
    grunt.registerTask("w", ['clean', 'copy','sync', 'ts', 'watch']);
    grunt.registerTask("build", ['copy', 'sync', 'ts']);
    grunt.registerTask("debug", ['copy', 'sync', 'ts', 'watch']);
    grunt.registerTask("samba","samba deployment", function(){
        initGrunt(sambaFolder);
        grunt.task.run('debug');
    });

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);
};
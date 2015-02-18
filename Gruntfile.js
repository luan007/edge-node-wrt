module.exports = function(grunt) {

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
                files: ['Applications/**/*.*', '!Applications/**/*.ts'] ,
                tasks: ['copy', 'sync'],
                options: {
                    spawn: false
                }
            }
        },
        clean: ['./_Releases'],
        copy: {
            main: {
                files: [
                    {expand: true, src: ['Misc/rootDir/*.*'],   flatten: true , dest: './_Releases/', filter: 'isFile'}
                ]
            }
        },
        sync: {
            main: {
                files: [
                    {src: ['Applications/**/*.*', '!Applications/**/*.ts']    , dest: './_Releases'},
                    {src: ['Modules/**/*.*',      '!Modules/**/*.ts']         , dest: './_Releases'},
                    {src: ['Orbit/**/*.*',        '!Orbit/**/*.ts']           , dest: './_Releases'},
                    {src: ['System/**/*.*',       '!System/**/*.ts']          , dest: './_Releases'},
                ],
                verbose: true // Display log messages when copying files
            }
        },
        ts: {
            default : {
                src: ['**/*.ts', '!node_modules/**/*.ts'],
                target: 'es5',
                outDir: './_Releases',
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
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");

    grunt.registerTask("default", ['clean', 'copy', 'sync', 'ts']);
    grunt.registerTask("w", ['clean', 'copy','sync', 'ts', 'watch']);
    grunt.registerTask("build", ['copy', 'sync', 'ts']);
    grunt.registerTask("debug", ['copy', 'sync', 'ts', 'watch']);

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);
};
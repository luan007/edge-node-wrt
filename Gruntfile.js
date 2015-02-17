module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            scripts: {
                files: ['**/*.ts'],
                tasks: ['ts'],
                options: {
                    spawn: false
                }
            }
        },
        clean: ['./_Releases'],
        copy: {
            main: {
                files: [
                    {expand: true, src: ['Applications/**/*.*', '!Applications/**/*.ts']    , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['Modules/**/*.*',      '!Modules/**/*.ts']         , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['Orbit/**/*.*',        '!Orbit/**/*.ts']           , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['System/**/*.*',       '!System/**/*.ts']          , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['Misc/rootDir/*.*'],   flatten: true               , dest: './_Releases/', filter: 'isFile'}
                ]
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
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-ts");

    grunt.registerTask("default", ['clean', 'copy', 'ts']);
    grunt.registerTask("w", ['clean', 'copy', 'ts', 'watch']);
    grunt.registerTask("build", ['copy', 'ts']);
    grunt.registerTask("debug", ['copy', 'ts', 'watch']);

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);
};
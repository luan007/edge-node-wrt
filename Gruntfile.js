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
        copy: {
            main: {
                files: [
                    {expand: true, src: ['Applications/**/*.*', '!Applications/**/*.ts']    , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['Modules/**/*.*',      '!Modules/**/*.ts']         , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['Orbit/**/*.*',        '!Orbit/**/*.ts']           , dest: './_Releases', filter: 'isFile'},
                    {expand: true, src: ['System/**/*.*',       '!System/**/*.ts']          , dest: './_Releases', filter: 'isFile'},
                ]
            }
        },
        ts: {
            default : {
                src: ["**/*.ts", "!node_modules/**/*.ts"],
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
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask("default", ['copy', 'ts']);
    grunt.registerTask("w", ['ts', 'watch']);

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);
};
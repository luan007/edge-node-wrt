module.exports = function(grunt) {
    //grunt.initConfig({
    //    ts: {
    //        default : {
    //            src: ["**/*.ts", "!node_modules/**/*.ts"],
    //            watch: ".",
    //            target: 'es5',
    //            outDir: './_Releases',
    //            options: {
    //                fast: "watch",
    //                module: "commonjs",
    //                sourceMap: false,
    //                suppressImplicitAnyIndexErrors: true,
    //                preserveConstEnums: true
    //            }
    //        }
    //    }
    //});



    grunt.initConfig({
        watch: {
            scripts: {
                files: ['**/*.ts'],
                tasks: ['ts'],
                options: {
                    spawn: false,
                },
            },
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
    grunt.registerTask("default", ['ts']);
    grunt.registerTask("w", ['ts', 'watch']);

    //grunt.loadNpmTasks("grunt-ts");
    //grunt.registerTask("default", ["ts"]);
};
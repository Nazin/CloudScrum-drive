module.exports = function (grunt) {
    'use strict';

    var config = {
        less: {
            main: {
                options: {
                    compress: true
                },
                files: {
                    'css/main.css': ['css/main.less']
                }
            }
        },
        watch: {
            main: {
                options: {
                    nospawn: true
                },
                files: ['css/main.less'],
                tasks: ['less:main']
            },
            reload: {
                options: {
                    livereload: true
                },
                files: ['css/**/*.css']
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask('default', ['less', 'watch']);

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
};
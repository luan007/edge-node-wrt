require.config({
    baseUrl: 'js',
    paths: {
        jquery: '../../vendor/jquery/dist/jquery',
        bootstrap: '../../vendor/bootstrap/dist/js/bootstrap',
        underscore: '../../vendor/underscore/underscore',
        backbone: '../../vendor/backbone/backbone',
        text: '../../vendor/requirejs-text/text',
        handlebars: '../../vendor/handlebars/handlebars.min',
        templates: '../../templates',
        tweenMax: '../../vendor/gsap/src/uncompressed/TweenMax',
        easelPlugin: '../../vendor/gsap/src/uncompressed/plugins/EaselPlugin'
    },
    shim: {
        bootstrap: {
            deps: ['jquery']
        },
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        underscore: {
            exports: '_'
        },
        handlebars: {
            exports: 'Handlebars'
        }
    }
});

define([
    'jquery',
    'underscore',
    'backbone',
    'routers/home-router'
], function($, _, Backbone, Router){

    new Router;

    Backbone.history.start();
});

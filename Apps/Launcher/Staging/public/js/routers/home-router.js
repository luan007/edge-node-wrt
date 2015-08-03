define([
    'jquery',
    'underscore',
    'backbone',
    'views/home-view'
], function($, _, Backbone, HomeView){
	
	return Backbone.Router.extend({

		routes: {
            '': 'index'
        },

        index: function(){

        	if(!this.iv) {
        		this.iv = new HomeView();
        	}
        	
        }

	});

});
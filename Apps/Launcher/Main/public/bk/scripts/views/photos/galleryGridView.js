define(["jquery","underscore","backbone","handlebars","utils/gridUtil","collections/photos/galleryCollection","text!templates/photos/galleryGrid.html"],function(e,t,n,r,i,s,o){return n.View.extend({el:"#photoContent",initialize:function(){this.collection=new s},render:function(){var e=r.compile(o);this.$el.html(e({galleryGrid:this.collection.toJSON()})),i.handleGridView(this.$el.find(">ul"))},events:{"click .gallery":"clickGallery"},clickGallery:function(t){console.log("click gallery");var n=e(t.target);if(!this.$el.find(".sel").is(":hidden"))if(n.attr("type")!="radio"){var r=e(t.currentTarget).find("input[type=radio]");r.prop("checked")?r.prop("checked",!1):r.prop("checked",!0),t.preventDefault()}else n.attr("checked")=="checked"?n.removeAttr("checked"):n.attr("checked","checked")}})});
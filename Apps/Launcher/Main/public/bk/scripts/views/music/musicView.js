define(["jquery","underscore","backbone","dragdealer","bootstrap"],function(e,t,n){return n.View.extend({render:function(){console.log("music successfull"),e(document).ready(function(){function m(){var t=0,n=!1;s.append(v),s.find(">li").each(function(){var r=e(this).position().top;if(t!==r)return n=!0,e(this).remove(),!1;t=r}),n||m()}function g(){var t=0,n=!1;return s.find(">li").each(function(){var r=e(this).position().top;if(t!==r)return n=!0,!1;t=r,n=!1}),n}function y(){var t=s.find(">li").not(".empty").size();if(t===0)return;if(!g()){s.find("li.empty").remove(),m();return}var n=0,r=0;s.find(">li").each(function(t){var i=e(this).position().top;if(n!==i&&t!==0)return r=t,!1;n=i});var i=t%r,o=r-i;if(o!==0){s.find("li.empty").remove();for(var u=0;u<o;u++)s.append(v)}}var t=e("#musicToolbar"),n=e("#playerCover"),r=n.find(".cover-wrap"),i=r.find("img"),s=e(".album-grid"),o=s.find(".album"),u=o.find(".sel"),a=e(".music-table input[type=checkbox]"),f=e(".toolbar").find(".btn"),l=e("#listViewBtn"),c=e("#gridViewBtn"),h=e("#addViewBtn"),p=e("#editViewBtn"),d=e("#editViewBtn4List");r.height(r.parent().height()),i.attr("src",i.attr("data-src")),e(window).resize(function(){t.hasClass("active")?r.height(r.parent().height()-110):r.height(r.parent().height()),y()}),r.click(function(){t.hasClass("active")?(e(this).height(e(this).height()+110),t.css("transform","translateY(110px)").removeClass("active")):(e(this).height(e(this).height()-110),t.css("transform","translateY(0)").addClass("active"))}),o.click(function(t){var n=e(t.target);if(u.is(":hidden")){var r=e(this).parent().parent();r.hasClass("expanded")?r.removeClass("expanded"):(s.find(">li").removeClass("expanded"),r.addClass("expanded"))}else if(n.attr("type")!="radio"){var i=e(this).find("input[type=radio]");i.prop("checked")?i.prop("checked",!1):i.prop("checked",!0)}else n.attr("checked")=="checked"?n.removeAttr("checked"):n.attr("checked","checked")}),p.click(function(){f.removeClass("active"),u.is(":hidden")?(u.fadeIn(),p.addClass("active"),t.css("transform","translateY(0)")):(u.fadeOut(),p.removeClass("active"),c.addClass("active"),t.css("transform","translateY(120px)"))}),d.click(function(){console.log("$editViewBtn4List"),f.removeClass("active"),a.is(":hidden")?(a.fadeIn(),d.addClass("active"),t.css("transform","translateY(0)")):(a.fadeOut(),d.removeClass("active"),l.addClass("active"),t.css("transform","translateY(-120px)"))});var v='<li class="empty"></li>';y()})}})});
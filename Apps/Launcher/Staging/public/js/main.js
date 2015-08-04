require.config({
    baseUrl: '/js',
    paths: {
        jquery: '//global.wifi.network/vendor/jquery/dist/jquery',
        bootstrap: '//global.wifi.network/vendor/bootstrap/dist/js/bootstrap',
        underscore: '//global.wifi.network/vendor/underscore/underscore',
        backbone: '//global.wifi.network/vendor/backbone/backbone',
        text: '//global.wifi.network/vendor/requirejs-text/text',
        handlebars: '//global.wifi.network/vendor/handlebars/handlebars.min',
        templates: '//global.wifi.network/templates',
        tweenMax: '//global.wifi.network/vendor/gsap/src/uncompressed/TweenMax',
        easelPlugin: '//global.wifi.network/vendor/gsap/src/uncompressed/plugins/EaselPlugin'
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


function loadPerspectBg(bg_selector) {
	var isFirstLoad = true;

	var perspective = 25;

	var fitTimeout = 0,
		offset = { left: 0, top: 0 };

	var $bg = $(bg_selector),
		$inner = $bg.find('.inner'),
		$img = $inner.find('img'),
		img = $img[0];

	if (!img) {
		return;
	}
	if (!img.naturalWidth) {
		$img.load(function () {
			loadPerspectBg(bg_selector);
		}).attr("src", $img.attr('data-src'));
		return;
	}

	var imgWidth = img.naturalWidth,
		imgHeight = img.naturalHeight,
		imgRatio = imgWidth / imgHeight; // 图片比例

	// ===============================
	// === 1. bg handle
	// ===============================
	// load home bg animation
	var fitBg = function () {
		offset = $bg.offset();
		clearTimeout(fitTimeout);
		fitTimeout = setTimeout(function () {
			var targetW,
				targetH,
				bgWidth = $bg.innerWidth(),
				bgHeight = $bg.innerHeight(),
				winRatio = bgWidth / bgHeight; // 窗口比例

			if (winRatio > imgRatio) { // 窗口比例 > 图片比例
				targetW = bgWidth * 1.2;
				targetH = (bgWidth / imgRatio) * 1.2;
			} else {
				targetW = (bgHeight * imgRatio) * 1.2;
				targetH = bgHeight * 1.2;
			}

			if (isFirstLoad) {
				TweenLite.to(img, 2, {
					startAt: {
						opacity: 0,
						scale: targetW / imgWidth,
						x: -((targetW - bgWidth) / 2) + 'px',
						y: -((targetH - bgHeight) / 2) + 30 + 'px'
					},
					y: -((targetH - bgHeight) / 2) + 'px',
					opacity: 1,
					ease: Power3.easeOut
				});

				isFirstLoad = false;
			} else {
				TweenLite.to(img, 1.2, {
					scale: targetW / imgWidth,
					x: -((targetW - bgWidth) / 2) + 'px',
					y: -((targetH - bgHeight) / 2) + 'px',
					ease: Power3.easeOut
				});
			}
		}, isFirstLoad ? 0 : 500);
	};

	fitBg();

	window.addEventListener("resize", fitBg);

	// ===============================
	// === 2.mouse move animation
	// ===============================
	if (perspective > 0) {
		TweenLite.set($inner, {
			transformPerspective: 4000,
			perspective: 4000
		});

		window.addEventListener("mousemove", function (e) {
			var bgWidth = $bg.innerWidth();
			var bgHeight = $bg.innerHeight();
			var relpX = (perspective * bgWidth) / 500;
			var relpY = (perspective * bgHeight) / 500;
			var deltaX = Math.min(bgWidth / 2,
				Math.max(- bgWidth / 2, ((e.clientX - offset.left)
					- bgWidth / 2))) / bgWidth;
			var deltaY = Math.min(bgHeight / 2,
				Math.max(- bgHeight / 2, ((e.clientY - offset.top)
					- bgHeight / 2))) / bgHeight;

			TweenLite.to($inner, 0.8, {
				css: {
					rotationX: deltaY * perspective / 1.6,
					rotationY: deltaX * perspective / 1.6,
					x: -deltaX * relpX,
					y: -deltaY * relpY
				},
				ease: Power0.easeNone
			});
		});
	}
}


switch (window.page) {
	case "index":

		define([
			'index',
		], function (index) {
			console.log("Loaded");
		});

		break;
	case "landscape":

		define([
			'landscape',
		], function (landscape) {
			console.log("Loaded");
		});

		break;
}









// 
// define([
//     'jquery',
//     'underscore',
//     'backbone',
//     'routers/home-router'
// ], function($, _, Backbone, Router){
// 
//     new Router;
// 
//     Backbone.history.start();
// });

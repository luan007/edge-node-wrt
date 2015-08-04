/// <reference path="../../../../../typings/jquery/jquery.d.ts"/>
define([
	'jquery',
	'tweenMax',
	'easelPlugin'
], function ($) {

	$(document).ready(function () {

		$(".load-mask").addClass("loaded");

		setTimeout(function () {
			$(".load-mask").remove();
		}, 1000);

		loadPerspectBg('.home-bg');
				
		// ===============================
		// === 3. app btn animation
		// ===============================
		var $appBtn = $('.app-btn'),
			$layer = $appBtn.find('.layer'),
			$shine = $appBtn.find('.shine'),
			$alldots = $appBtn.find('.alldots'),
			$decborder = $appBtn.find('.decborder'),
			$dotA = $appBtn.find('.dots-a'),
			$center = $appBtn.find('.dots-b'),
			$dotC = $appBtn.find('.dots-c'),
			$circle = $appBtn.find('.circle-center'),
			$tagline = $appBtn.find('.tagline');

		var shine = new TimelineLite({
			onComplete: function () {
				shine.restart();
			}
		});

		shine.pause();

		shine.to($shine, 1, {
			delay: 2,
			className: "+=lit",
			ease: Power0.noease
		}).to($shine, 2, {
			className: "+=lit_full",
			ease: Power0.noease
		}).to($shine, 5, {
			className: "+=norm",
			ease: Power3.easeInOut
		});

		shine.play();

		var state = 0;

		var mouseUp = function () {
			shine.stop();
			state = 1;
			setTimeout(function () {
				if (state === 0) return;
				TweenLite.to($decborder, 0.8, {
					css: {
						scale: 1,
						opacity: 1,
						backgroundColor: "rgba(255,255,255,0.2)"
					},
					ease: Power2.easeOut
				});

			}, 100);

			TweenLite.to($alldots, 0.2, {
				opacity: 1
			});
			TweenLite.to($shine, 0.2, {
				opacity: 0
			});
			TweenLite.to($circle, 0.3, {
				css: {
					fill: "#FFF"
				},
				ease: Power3.easeOut
			});
			TweenLite.to($tagline, 0.5, {
				css: {
					opacity: 1,
					scale: 1,
					color: "#0092ff"
				},
				ease: Power3.easeOut
			});
			TweenLite.to($center, 0.8, {
				css: {
					scale: 1.4
				},
				ease: Power3.easeOut
			});
			TweenLite.to([$dotA, $dotC], 0.4, {
				css: {
					scale: 0
				}
			});
		};

		var mouseDown = function () {
			state = 2;
			TweenLite.to($center, 0.3, {
				css: {
					scale: 1.2
				},
				ease: Power3.easeOut
			});
			TweenLite.to($tagline, 0.5, {
				css: {
					scale: 0.9,
					color: "#fff"
				},
				ease: Power3.easeOut
			});
			TweenLite.to($circle, 0.3, {
				css: {
					fill: "#0092ff"
				},
				ease: Power3.easeOut
			});
			TweenLite.to($decborder, 0.4, {
				css: {
					scale: 0.95,
					backgroundColor: "rgba(255,255,255,0.6)"
				},
				ease: Power3.easeOut
			});
		};

		var normal = function () {
			shine.restart();
			state = 0;

			TweenLite.to($alldots, 0.2, {
				opacity: 0.9
			});
			TweenLite.to($shine, 0.2, {
				opacity: 1
			});
			TweenLite.to($decborder, 0.2, {
				css: {
					scale: 0,
					opacity: 0,
					backgroundColor: "rgba(255,255,255,1)"
				}
			});
			TweenLite.to($tagline, 0.3, {
				css: {
					opacity: 0,
					scale: 0.5,
					color: "#0092ff"
				},
				ease: Power3.easeOut
			});
			TweenLite.to($tagline, 0.3, {
				css: {
					opacity: 0
				},
				ease: Power3.easeOut
			});
			TweenLite.to($circle, 0.2, {
				css: {
					fill: "#fff"
				},
				ease: Power3.easeOut
			});
			TweenLite.to($center, 0.6, {
				css: {
					scale: 0.21
				},
				ease: Power3.easeOut
			});
			TweenLite.to([$dotA, $dotC], 1.5, {
				css: {
					scale: 0.21
				},
				ease: Power2.easeOut
			});
		};

		$layer.hover(mouseUp, normal);
		$layer.mousedown(mouseDown);
		$layer.mouseup(mouseUp);

		// ===============================
		// === 4. click app btn
		// ===============================
		var $homeMask = $('.home-mask'),
			$appList = $('.app-list'),
			$appListBack = $appList.find('.list-back');

		var $welPage = $('.welcome-page');

		// open app list
		$appBtn.click(function () {
			TweenLite.to($welPage, 0.4, {
				scale: 1.3,
				opacity: 0,
				ease: Power2.easeIn,
				onComplete: function () {
					$welPage.css("display", "none");
				}
			});

			$appList.css("display", "block");
            TweenLite.to($appList, 0.7, {
                delay: 0.2 + 0.18,
                scale: 1,
                ease: Expo.easeOut
            });
            TweenLite.to($appList, 0.7, {
                delay: 0.2 + 0.18,
                opacity: 1,
                ease: Power1.easeOut
            });
			TweenLite.to($homeMask, 0.4, {
				delay: 0.4,
				opacity: 0.8,
				ease: Power2.easeOut
			});
		});

		// close app list
		$appListBack.click(function () {
			TweenLite.to($appList, 0.5, {
                delay: 0,
                scale: 0.5,
                ease: Power2.easeIn
            });
            TweenLite.to($appList, 0.3, {
                opacity: 0,
                onComplete: function () {
					$appList.css("display", "none");
                }
            });
			$welPage.css("display", "block");
            TweenLite.to($welPage, 2, {
				scale: 1,
				opacity: 1,
				ease: Expo.easeOut
            });
            TweenLite.to($homeMask, 0.5, {
				delay: 0.2,
				opacity: 0.3,
				ease: Power2.easeOut
            });
		});

		// ===============================
		// === 5. show user page
		// ===============================
		var $homeMe = $('.user-page'),
			$homeMeLeft = $homeMe.find('.user-panel'),
			$homeMeContent = $homeMe.find('.content'),
			$userWidget = $('.widget-user');


		$homeMe.click(function () {
			TweenLite.to($homeMeLeft, 0.3, {
				opacity: 0,
				x: "-50px",
				ease: Power3.easeIn
			});
			TweenLite.to($homeMeContent, 0.3, {
				y: "-10%",
				opacity: 0,
				ease: Power3.easeIn
			});
			TweenLite.to($homeMe, 0.2, {
				delay: 0.3,
				backgroundColor: "rgba(0,0,0,0)",
				onComplete: function () {
					$homeMe.css("display", "none");
					$welPage.css("display", "block");
					TweenLite.to($welPage, 0.8, {
						scale: 1,
						opacity: 1,
						ease: Expo.easeOut
					});
				}
			});
		});

		$userWidget.click(function () {

			TweenLite.to($welPage, 0.4, {
				scale: 1.3,
				opacity: 0,
				ease: Power2.easeIn,
				onComplete: function () {
					$welPage.css("display", "none");
					TweenLite.set($homeMeLeft, {
						opacity: 0,
						x: "-50px"
					});
					TweenLite.set($homeMeContent, {
						y: "-10%",
						opacity: 0
					});

					$homeMe.css("display", "block");

					TweenLite.to($homeMeLeft, 1, {
						delay: 0.2,
						opacity: 1,
						x: 0,
						ease: Expo.easeOut
					});
					TweenLite.to($homeMe, 0.2, {
						backgroundColor: "rgba(0,0,0,0.6)",
					});
					TweenLite.to($homeMeContent, 1, {
						delay: 0.2,
						opacity: 1,
						y: "0%",
						ease: Expo.easeOut
					});
				}
			});

		});

	});


	return {};

});
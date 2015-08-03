define([
    'jquery',
    'underscore',
    'backbone',
    'tweenMax',
    'easelPlugin'
], function($, _, Backbone) {

	return Backbone.View.extend({

		initialize: function(){
			console.log('initialize index view');

			$(document).ready(function(){

				function loadPerspectBg(bg_selector){
                    var isFirstLoad = true;

                    var perspective = 15;

                    var fitTimeout = 0,
                        offset = { left: 0, top: 0 };

                    var $bg = $(bg_selector),
                        $inner = $bg.find('.inner'),
                        $img = $inner.find('img'),
                        img = $img[0];

                    if(!img){
                        return;
                    }

                    if (!img.naturalWidth) {
                        $img.load(function(){
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
                    var fitBg = function(){
                        offset = $bg.offset();
                        clearTimeout(fitTimeout);
                        fitTimeout = setTimeout(function(){
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

                            if(isFirstLoad) {
                                TweenLite.to(img, 1.5, {
                                    startAt: {
                                        opacity: 0,
                                        scale: targetW / imgWidth,
                                        x: -((targetW - bgWidth) / 2)  + 'px',
                                        y: -((targetH - bgHeight) / 2) + 30 + 'px'
                                    },
                                    y: -((targetH - bgHeight) / 2) + 'px',
                                    opacity: 1,
                                    ease: Power3.easeOut
                                });

                                isFirstLoad = false;
                            } else {
                                TweenLite.to(img, 0.8, {
                                    scale: targetW / imgWidth,
                                    x: -((targetW - bgWidth) / 2) + 'px',
                                    y: -((targetH - bgHeight) / 2) + 'px',
                                    ease: Power3.easeOut
                                });
                            }
                        }, 100);
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
                    onComplete: function(){
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

                var mouseUp = function() {
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

                var mouseDown = function() {
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
                            color:"#fff"
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

                var normal = function() {
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

                var tl = new TimelineLite();

                // open app list
                $appBtn.click(function(){
					tl.clear(true);

                    tl.to($welPage, 0.4, {
                        scale: 1.3,
                        opacity: 0,
                        ease: Power2.easeIn
                    });

                    tl.to($appList, .6 , {
                        scale: 1,
                        ease: Expo.easeOut
                    }, "-=.02");

                    tl.to($appList, .7 , {
                        opacity: 1,
                        visibility: "visible",
                        ease: Power1.easeOut
                    }, "-=.62");

                    tl.to($homeMask, .5, {
                        opacity: 0.8,
                        ease: Expo.easeOut
                    }, "-=.52");
                });

                // close app list
                $appListBack.click(function(){

                    tl.clear(true);

                    tl.to($appList, 0.3, {
                        scale: 0.5,
                        ease: Power2.easeIn
                    });

                    tl.to($appList, 0.25, {
                        opacity: 0,
                        onComplete: function () {
                            $appList.css("visibility", "hidden");
                        }
                    }, '-=.2');

                    tl.to($welPage, 2, {
                        scale: 1,
                        opacity: 1,
                        ease: Expo.easeOut
                    }, "-=.3");

                    tl.to($homeMask, .5, {
                        opacity: .3,
                        ease: Power2.easeOut
                    }, "-=1.7");
                });

                // ===============================
                // === 5. show user page
                // ===============================
                var $homeMe = $('.user-page'),
                    $homeMeLeft = $homeMe.find('.user-panel'),
                    $homeMeContent = $homeMe.find('.content'),
                    $userWidget = $('.widget-user');

                $userWidget.click(function(){
                    tl.clear(true);

                    tl.set($homeMeLeft, {
                        opacity: 0,
                        x: "-50px"
                    });

                    tl.set($homeMeContent, {
                        y: "-10%",
                        opacity: 0
                    });

                    tl.to($welPage, 0.4, {
                        scale: 1.3,
                        opacity: 0,
                        ease: Power2.easeIn
                    });

                    tl.to($homeMe, .2, {
                        backgroundColor: "rgba(0,0,0,0.6)",
                        visibility: "visible"
                    });

                    tl.to($homeMeLeft, 1, {
                        opacity: 1,
                        x: 0,
                        ease: Expo.easeOut
                    }, "-=.2");

                    tl.to($homeMeContent, 1, {
                        opacity: 1,
                        y: "0%",
                        ease: Expo.easeOut
                    }, "-=1.2");
                });

                $homeMe.click(function(){
                    tl.clear(true);

                    tl.to($homeMeLeft, .3, {
                        opacity: 0,
                        x: "-50px",
                        ease: Power3.easeIn
                    });

                    tl.to($homeMeContent, .3, {
                        y: "-10%",
                        opacity: 0,
                        ease: Power3.easeIn
                    }, "-=.3");

                    tl.to($homeMe, .2, {
                        backgroundColor: "rgba(0,0,0,0)",
                        onComplete: function(){
                            $homeMe.css("visibility", "hidden");
                        }
                    });

                    tl.to($welPage, .8 , {
                        scale: 1,
                        opacity: 1,
                        ease: Expo.easeOut
                    });
                });

			});

		}

	});

});

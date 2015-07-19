/// <reference path="../../../typings/jquery/jquery.d.ts"/>
var theme_color = "rgba(47, 175, 255, 1)";

var elementStore = [];

function choke(t, timeout) {
    clearTimeout(t["_t"]);
    var s = setTimeout(t, timeout);
    t["_t"] = s;
}

function toElementStore(dom, obj) {
    var data = {
        dom: dom,
        obj: obj
    };
    var prev = $(dom).attr("_e_id");
    if (!prev) {
        var id = elementStore.push(data) - 1;
        $(dom).attr("_e_id", id);
        return id;
    }
    else {
        elementStore[Number(prev)] = data;
        return Number(prev);
    }
}

function fromElementStore(dom) {
    var prev = $(dom).attr("_e_id");
    if (!prev) return undefined;
    return elementStore[Number(prev)];
}

/* Comp-Background */
function comp_background(bg_id, perspective) {
    


    var pano_ = 0.1;
    var pano_ratio = 1 + pano_;
    var timeout = 100;
    var element = document.getElementById(bg_id);
    if (!element) return;
    var img = element.firstChild;
    
    if (!img.naturalWidth) {
        img.addEventListener("load", comp_background.bind(null, bg_id, perspective));
        var src = img.attributes.getNamedItem("data-bg-src").__value;
        $(img).attr("src", src);
        return;
    }
    var h = img.naturalHeight;
    var w = img.naturalWidth;
    var ratio = w / h;
    
    var _mtimeout = 0;
    var first_time = true;
    var fit = function () {
        clearTimeout(_mtimeout);
        _mtimeout = setTimeout(function () {
            var targetW, targetH;
            //fit
            var wratio = window.innerWidth / window.innerHeight;
            if (wratio > ratio) {
                //stretch w
                targetH = (window.innerWidth / ratio) * pano_ratio;
                targetW = (window.innerWidth) * pano_ratio;

            } else {
                //stretch h
                targetW = (window.innerHeight * ratio) * pano_ratio;
                targetH = (window.innerHeight) * pano_ratio;
                    //img.style.top = -(window.innerHeight) * (pano_ratio - 1) / 2 + "px";
                    //img.style.left = -((window.innerHeight * ratio) - window.innerWidth) / 2 * pano_ratio + "px";
            }
            
            TweenLite.to(img, first_time ? 0 : 0.8, {
                css: {
                    scale: targetW / w,
                    x: -((targetW - window.innerWidth) / 2) + "px",
                    y: -((targetH - window.innerHeight) / 2) + "px"
                },
                ease: Power3.easeOut
            });
            if (first_time) {
                TweenLite.to(img, 2, {
                    startAt: {
                        opacity: 0,
                        rotationX: -2,
                    },
                    scale: targetW / w,
                    rotationX: 0,
                    opacity: 1,
                    ease: Power3.easeOut
                });
                first_time = false;
            }
                //img.style.height = targetH + "px";
                //img.style.width  = targetW + "px";
                //img.style.left   = -((targetW - window.innerWidth) / 2) + "px";
                //img.style.top    = -((targetH - window.innerHeight) / 2) + "px";

                //TweenLite.to(img, 500, )


        }, timeout);
    }
    fit();
    
    window.addEventListener("resize", fit);
    if (perspective > 0) {
        TweenLite.set(element, {
            transformPerspective: 4000, perspective: 4000
        });
        
        window.addEventListener("mousemove", function (e) {
            
            var relpX = (perspective * window.innerWidth) / 500;
            var relpY = (perspective * window.innerHeight) / 500;
            var deltaX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
            var deltaY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
            //document.title = deltaX + "," + deltaY;
            TweenLite.to(element, 0.8, {
                css: {
                    rotationX: deltaY * perspective / 1.6,
                    rotationY: deltaX * perspective / 1.6,
                    x: -deltaX * relpX,
                    y: -deltaY * relpY
                        //rotationY: e.y
                },
                ease: Power0.easeNone
            });
        });
    }
    
    toElementStore(element, {
        update: fit,
        img: img
    });
}

function comp_main_toolico() {
    var icos = document.getElementsByClassName("main-toolico");
    for (var i = 0; i < icos.length; i++) {
        (function (i) {
            var ico = icos.item(i);
            var text = ico.firstChild;
            var i = ico.lastChild;
            var fromLeft = text.nodeName.toUpperCase() === "SPAN";
            
            if (!fromLeft) {
                text = [i, i = text][0]
            }
            
            var sign = fromLeft ? "-" : "";
            
            TweenLite.to(text, 0, {
                x: sign + 15 + "px"
            });
            var over = function () {
                var pressed = ico.attributes["color-pressed"] ? ico.attributes["color-pressed"].value : theme_color;
                var text_no_retract = ico.attributes["do-not-retract"];
                
                TweenLite.to(ico, 0.3, {
                    color: "#FFF",
                    opacity: 1,
                    y: -2 + "px",
                    ease: Power2.easeOut
                });
                TweenLite.to(text, 0.5, {
                    opacity: 1,
                    x: 0 + "px",
                    ease: Power2.easeOut
                });
                TweenLite.to(i, 0.2, {
                    color: "rgba(255,255,255,255)",
                    background: "rgba(255,255,255,0)",
                    textShadow: "0px 5px 2px rgba(0,0,0,0.2)",
                    ease: Power2.easeOut
                });
            };
            var leave = function () {
                var pressed = ico.attributes["color-pressed"] ? ico.attributes["color-pressed"].value : theme_color;
                var text_no_retract = ico.attributes["do-not-retract"];
                
                TweenLite.to(ico, 0.3, {
                    opacity: 0.8,
                    y: 0 + "px",
                    ease: Power2.easeOut
                });
                TweenLite.to(text, 0.5, {
                    opacity: text_no_retract ? 1 : 0,
                    x: sign + 5 + "px",
                    ease: Power2.easeOut
                });
                TweenLite.to(i, 0.2, {
                    color: "rgba(255,255,255,255)",
                    background: "rgba(255,255,255,0)",
                    textShadow: "0px 6px 20px rgba(0,0,0,0.1)",
                    ease: Power2.easeOut
                });
            };
            var down = function () {
                var pressed = ico.attributes["color-pressed"] ? ico.attributes["color-pressed"].value : theme_color;
                var text_no_retract = ico.attributes["do-not-retract"];
                
                TweenLite.to(ico, 0.1, {
                    opacity: 1,
                    y: 0 + "px",
                    ease: Power2.easeOut
                });
                TweenLite.to(i, 0.3, {
                    color: pressed,
                    background: "rgba(255,255,255,255)",
                    textShadow: "0px 0px 10px rgba(0,0,0,0)",
                    ease: Power2.easeOut
                });
            };
            $(ico).hover(over, leave).mousedown(down).mouseup(over);
            
            leave();
            
            var id = toElementStore(ico, {
                over: over,
                leave: leave,
                update: leave,
                down: down
            });

        })(i);
    }
}

function comp_main_entry_icon() {
    
    var ico = document.getElementById("main-entry-button");
    if (!ico) return;
    var timeline = new TimelineMax({ repeat: -1 });
    timeline.Set(ico, {
        border: "1px solid rgba(255,255,255,0)",
    });
    timeline.to(ico, 0.5, {
        border: "1px solid rgba(255,255,255,1)",
        ease: Power1.easeOut
    }, '+=1.6');
    timeline.to(ico, 2.5, {
        border: "1px solid rgba(255,255,255,0)",
        ease: Power1.easeOut
    }, "+=0.2");
    timeline.play();
    
    var over = function () {
        timeline.stop();
        TweenLite.to(ico, 0.3, {
            background: theme_color,
            y: -5 + "px",
            scale: 1,
            border: "1px solid rgba(255,255,255,0)",
            ease: Power1.easeOut
        });
    };
    var leave = function () {
        TweenLite.to(ico, 2, {
            background: "rgba(0,0,0,0.1)",
            y: 0 + "px",
            scale: 1,
            ease: Power1.easeOut
        });
        timeline.restart();
    };
    var down = function () {
        TweenLite.to(ico, 0.1, {
            y: 5 + "px",
            scale: 0.95,
            background: "rgba(0, 110, 200, 1)",
            ease: Power1.easeOut
        });
    };
    $(ico).hover(over, leave).mousedown(down).mouseup(over);
    $(ico).click(function () {
        window["AppList"].open();
    });
    
    leave();
    
    var id = toElementStore(ico, {
        over: over,
        leave: leave,
        update: leave,
        down: down
    });
}

function comp_app_ico() {
    var icos = document.getElementsByClassName("app-list-icon");
    for (var i = 0; i < icos.length; i++) {
        (function (i) {
            var ico = icos.item(i);
            var text = ico.lastChild;
            var t = $(ico).children("div");
            var img = t.children("img");
            var over = function () {
                TweenLite.to(ico, 0.3, {
                    y: -5 + "px",
                    scale: 1.1,
                    ease: Power2.easeOut
                });
                TweenLite.to(t, 0.3, {
                    background: "rgba(255,255,255,0.5)",
                    ease: Power2.easeOut
                });
                TweenLite.to(img, 0.3, {
                    scale: 0.95,
                    ease: Power2.easeOut
                });
            };
            var leave = function () {
                TweenLite.to(ico, 0.3, {
                    y: 0 + "px",
                    scale: 1,
                    ease: Power2.easeOut
                });
                TweenLite.to(t, 0.3, {
                    background: "rgba(255,255,255,0)",
                    ease: Power2.easeOut
                });
                TweenLite.to(img, 0.3, {
                    scale: 1,
                    ease: Power2.easeOut
                });
            };
            var down = function () {
                TweenLite.to(ico, 0.1, {
                    y: 0 + "px",
                    scale: 0.95,
                    ease: Power2.easeOut
                });
                TweenLite.to(t, 0.3, {
                    background: "rgba(255,255,255,1)",
                    ease: Power2.easeOut
                });
                TweenLite.to(img, 0.3, {
                    scale: 0.9,
                    ease: Power2.easeOut
                });
            };
            $(ico).hover(over, leave).mousedown(down).mouseup(over);
            $(ico).click(function (e) {
                e.stopPropagation();
            });
            leave();
            
            var id = toElementStore(ico, {
                over: over,
                leave: leave,
                update: leave,
                down: down
            });

        })(i);
    }
}

function comp_app_list() {
    var list = document.getElementById("app-list-parent");
    if (!list) return;
    var content = document.getElementById("main-content");
    var applist = document.getElementById("app-list-area");
    
    TweenLite.set(list, {
        scale: 4,
        opacity: 0,
    });
    TweenLite.set(applist, {
        opacity: 0,
    });
    function open() {
        applist.style.visibility = "visible";
        TweenLite.to(list, 0.8, {
            opacity: 1,
            scale: 1,
            ease: Power4.easeOut
        });
        TweenLite.to(applist, 1, {
            opacity: 1
        });
        TweenLite.to(content, 0.6, {
            scale: 0.8,
            ease: Power2.easeOut
        });
        TweenLite.to(content, 0.6, {
            opacity: 0,
            ease: Power2.easeOut
        });
    }
    
    function close() {
        TweenLite.to(applist, 0.4, {
            opacity: 0
        });
        TweenLite.to(list, 0.5, {
            scale: 4,
            opacity: 0,
        });
        TweenLite.to(content, 0.8, {
            opacity: 1,
            scale: 1,
            ease: Power4.easeOut,
            onComplete: function () {
                applist.style.visibility = "hidden";
            }
        });
    }
    var id = toElementStore(applist, {
        open: open,
        close: close
    });
    
    window.AppList = {
        open: open,
        close: close
    };
    
    $(applist).click(function () {
        AppList.close();
    });
}

function comp_generic_ico() {
    var icos = document.getElementsByClassName("generic-ico");
    for (var i = 0; i < icos.length; i++) {
        (function (i) {
            var ico = icos.item(i);
            var over = function () {
                var pressed = ico.attributes["color-pressed"] ? ico.attributes["color-pressed"].value : theme_color;
                var released = ico.attributes["color-released"] ? ico.attributes["color-released"].value : "#000";
                var fixopa = !!ico.attributes["data-fix-opacity"];
                TweenLite.to(ico, 0.3, {
                    color: pressed,
                    opacity: fixopa ? 1 : 0.7,
                    y: -3 + "px",
                    ease: Power2.easeOut
                });
            };
            var leave = function () {
                var pressed = ico.attributes["color-pressed"] ? ico.attributes["color-pressed"].value : theme_color;
                var released = ico.attributes["color-released"] ? ico.attributes["color-released"].value : "#000";
                var fixopa = !!ico.attributes["data-fix-opacity"];
                TweenLite.to(ico, 0.3, {
                    color: released,
                    opacity: fixopa ? 1 : 1,
                    y: 0 + "px",
                    ease: Power2.easeOut
                });
            };
            var down = function () {
                var pressed = ico.attributes["color-pressed"] ? ico.attributes["color-pressed"].value : theme_color;
                var released = ico.attributes["color-released"] ? ico.attributes["color-released"].value : "#000";
                var fixopa = !!ico.attributes["data-fix-opacity"];
                TweenLite.to(ico, 0.1, {
                    opacity: fixopa ? 1 : 1,
                    y: 0 + "px",
                    color: pressed,
                    ease: Power2.easeOut
                });
            };
            $(ico).hover(over, leave).mousedown(down).mouseup(over);
            leave();
            var id = toElementStore(ico, {
                over: over,
                leave: leave,
                update: leave,
                down: down
            });

        })(i);
    }
}

function comp_menu() {
    var menu = document.getElementById("menu");
    var area = document.getElementById("menu-area");
    var ico = document.getElementById("menu-icon");
    var tab = document.getElementById("menu-tab-area");
    var tabbg = document.getElementById("menu-tab-bg");
    var pushing = document.getElementsByClassName("pushed-by-menu");
    var menu_mask = $("<div></div>")
                        .css("position", "fixed")
                        .css("top", "0")
                        .css("left", "0")
                        .css("right", "0")
                        .css("bottom", "0")
                        .css("z-index", "999")
                        .css("display", "none")
                        .css("background", "rgba(255,255,255,0)")
                        .insertBefore($(menu));
    
    var menustate = 0;
    if (!area) return;
    
    TweenLite.set(tab,  {
        opacity: 0,
        x: -10 + "px"
    });

    var menu_open = function () {
        if (menustate) return;
        menustate = 1;
        $(menu_mask).css("display", "block");
        $(tab).css("display", "block");
        //$(ico).removeClass("icon-menu");
        //$(ico).addClass("icon-left-open-mini");
        $(ico).attr("color-released", "#FFF");
        TweenLite.to(area, 0.7, {
            x: 350 + "px",
            ease: Power4.easeOut
        });
        TweenLite.to(ico, 0.8, {
            x: 280 + "px",
            ease: Power3.easeOut
        });
        TweenLite.to(tab, 0.8, {
            opacity: 1,
            x: 280 + "px",
            ease: Power3.easeOut
        });
        TweenLite.to(pushing, 1.3, {
            x: 100 + "px",
            opacity: 0.2,
            ease: Power3.easeOut
        });
        //TweenLite.to(menu_mask, 1, {
        //    background: "rgba(255,255,255,0.9)",
        //    ease: Power3.easeOut
        //});
    };
    
    var menu_close = function () {
        if (!menustate) return;
        $(menu_mask).css("display", "none");
        menustate = 0;
        //$(ico).addClass("icon-menu");
        //$(ico).removeClass("icon-left-open-mini");
        
        $(ico).attr("color-released", $(ico).attr("default-color"));
        fromElementStore(ico).obj.leave();
        TweenLite.to(area, 0.5, {
            x: 0 + "px",
            ease: Power4.easeOut
        });
        TweenLite.to(ico, 0.7, {
            x: 0 + "px",
            ease: Power3.easeOut
        });
        TweenLite.to(tab, 0.7, {
            opacity: 0,
            x: -10 + "px",
            ease: Power3.easeOut,
            onComplete: function () {
                $(tab).css("display", "none");
            }
        });
        TweenLite.to(pushing, 0.7, {
            x: 0 + "px",
            opacity: 1,
            ease: Power4.easeOut
        });
        //TweenLite.to(menu_mask, 0.7, {
        //    background: "rgba(255, 255, 255, 0)",
        //    ease: Power3.easeOut
        //});
    };
    
    var menu_toggle = function () {
        if (menustate) menu_close();
        else menu_open();
    }

    var over = function (e) {
        if (!menustate) {
            $(tab).css("display", "block");
            $(ico).attr("color-released", "#FFF");
            TweenLite.to(tab, 0.6, {
                opacity: 1,
                x: 0 + "px",
                ease: Power3.easeOut
            });
            TweenLite.to(area, 0.5, {
                x: 70 + "px",
                ease: Power4.easeOut
            });
        }
    };
    var leave = function () {
        if (!menustate) {
            $(ico).attr("color-released", $(ico).attr("default-color"));
            fromElementStore(ico).obj.leave();
            TweenLite.to(tab, 0.3, {
                opacity: 0,
                x: -10 + "px",
                ease: Power3.easeOut,
                onComplete: function () { 
                    $(tab).css("display", "none");
                }
            });
            TweenLite.to(area, 0.5, {
                x: 0 + "px",
                ease: Power4.easeOut
            });
        }
    };
    var down = function () {
        menu_toggle();
    };
    menu_mask.mousedown(down);
    $(ico).mouseenter(over);
    $(ico).mousedown(down);
    $(menu).mouseleave(leave);
}

function href_div() {
    $(".href").click(function () {
        var h = $(this).attr("href");
        if (h) {
            document.getElementById("mask-loading").style.background = "#FFF";
            setTimeout(function () {
                window.location = h;
            }, 400);
        }
    });
}


var _firstTime_resize = true;
/*window.resize*/
function resize_handler() {
    
    var windowH = window.innerHeight;
    var windowW = window.innerWidth;
    
    /*v-auto-center*/
    var e = document.getElementsByClassName("v-auto-center");
    for (var i = 0; i < e.length; i++) {
        var height = e.item(i).clientHeight;
        e.item(i).style["top"] = ($(e.item(i)).parent().height() - height) / 2 - 50 + "px";
    }
    
    /*app-list*/
    var tw = $("#app-list").parent().width();
    var th = $("#app-list").parent().height();
    var h = $("#app-list").height();
    
    var deltah = Math.max(0, (th - h) / 2 - 100);
    
    var c = $("#app-list").children();
    if (!c.length) return;
    var cur = $(c[0]);
    for (var i = 1; i < c.length; i++) {
        var pos = cur.position();
        var nxt = $(c[i]).position();
        if (nxt.top !== pos.top) break;
        cur = $(c[i]);
    }
    var w = cur.get(0).offsetLeft + cur.width() + 30 + 20;
    var dt = (tw - w) / 2;
    TweenLite.to($("#app-list"), _firstTime_resize ? 0 : 1, {
        left: dt + "px",
        top: deltah + "px",
        ease: Power2.easeOut
    });
    
    //var entryBtn = document.getElementById("main-entry-button");
    //entryBtn.style.bottom = (windowH * 0.08) + "px";
    //entryBtn.style.left = ((windowW) - entryBtn.clientWidth) / 8 + "px";
    
    if (_firstTime_resize) {
        setTimeout(window_loaded, 0);
    }
    _firstTime_resize = false;
}

function window_loaded() {
    var content = document.getElementById("main-content");
    TweenLite.set(content, {
        rotationX: 10,
        y: 50 + "px",
        opacity: 0,
        scale: 0.8,
        visibility: 'visible',
        transformPerspective: 1000, perspective: 1000,
    });
    TweenLite.to(content, 1.7, {
        opacity: 1,
        y: 0 + "px",
        scale: 1,
        rotationX: 0,
        ease: Power4.easeOut
    });
}

window.addEventListener("load", function () {
    href_div();
    comp_background("main-bg", 20);
    comp_main_toolico();
    comp_main_entry_icon();
    comp_app_ico();
    comp_app_list();
    comp_menu();
    comp_generic_ico();
});

window.addEventListener("resize", choke.bind(null, resize_handler, 100));
window.addEventListener("load", choke.bind(null, resize_handler, 100));

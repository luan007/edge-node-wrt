(function () {
    if (this.__edge__) {
        return;
    }
    this.__edge__ = Date.now();

    this.msieversion = function () {

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer, return version number
            return (parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))));

        return false;
    };

    this.choke = function (t, timeout) {
        clearTimeout(t["_t"]);
        var s = setTimeout(t, timeout);
        t["_t"] = s;
    };
    //May appear sluggish, u may turn this off..
    //monkey patch isotope
    if (0) {
        Isotope.prototype._setContainerMeasure = function (measure, isWidth) {
            if (measure === undefined) {
                return;
            }
            var elemSize = this.size;
            // add padding and border width if border box
            if (elemSize.isBorderBox) {
                measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
                  elemSize.borderLeftWidth + elemSize.borderRightWidth :
                  elemSize.paddingBottom + elemSize.paddingTop +
                  elemSize.borderTopWidth + elemSize.borderBottomWidth;
            }
            measure = Math.max(measure, 0);
            var ops = {};
            ops[isWidth ? 'width' : 'height'] = measure + "px";
            TweenLite.to(this.element, 0.5, { css: ops, ease: Power1.easeOut });
            //this.element.style[isWidth ? 'width' : 'height'] = measure + 'px';
        };
    }


    riot.settings.brackets = '{{ }}';



    //https://remysharp.com/2010/07/21/throttling-function-calls
    this.throttle = function (fn, threshhold, scope) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;
        return function () {
            var context = scope || this;

            var now = +new Date,
                args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    };

}).apply(window); //whoo
/*
 http://stackoverflow.com/questions/1480133/how-can-i-get-an-objects-absolute-position-on-the-page-in-javascript
 */

//http://jherax.github.io/#isdom-object
function isDOM(obj) {
    // DOM, Level2
    if ("HTMLElement" in window) {
        return (!!obj && obj instanceof HTMLElement);
    }
    // Older browsers
    return (!!obj && typeof obj === "object" && obj.nodeType === 1 && !!obj.nodeName);
}

function compArr(a, b) {
    if (!(Array.isArray(a) && Array.isArray(b)) ||
        a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

function cumulativeOffset(element) {
    if (!isDOM(element)) { return element; }
    var top = 0, left = 0;
    do {
        top += element.offsetTop + element.scrollTop || 0;
        left += element.offsetLeft + element.scrollLeft || 0;
        element = element.offsetParent;
    } while (element);
    return {
        top: top,
        left: left
    };
}

var REPAINT_THRESHOLD = 150;
var RATIO_SENSITIVITY = 0.05;
function imageCache() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext("2d");
    this.img = undefined; //<img>
    //this.imgData = undefined; //[[ rgba ], [ rgba ]]
    this.prevImgW = 0; //as said
    this.prevImgH = 0; //as said
    this.prevImgX = 0; //as said
    this.prevImgY = 0; //as said
    this.detectionSegment = 1;
    this.scaleFactor = 1;
    this.defColor = [255, 255, 255, 0];
    this.tracing = [];  //dom_elements
    this.trace = function (img) {
        if (this.img !== img) {
            this.img = img;
            this.prevImgW = undefined;
            this.prevImgH = undefined;
            var _this = this;
            //this.imgData = undefined;
            window.addEventListener("load", function () {
                _this.update();
            });
            img.addEventListener("load", function () {
                _this.update();
            });
            this.update();
        }
    };

    this.update = function () {
        var newHeight = this.img.clientHeight,
            newWidth = this.img.clientWidth,
            absOffset = cumulativeOffset(this.img),
            ratio = newHeight ? (newWidth / newHeight) : 0,
            prevRatio = this.prevImgH ? (this.prevImgW / this.prevImgH) : 0,
            changed = false;
        if (/*!this.imgData*/ this.prevImgH === undefined || Math.abs((prevRatio / ratio) - 1) > RATIO_SENSITIVITY
            || /*wobbleeee*/ Math.abs(newHeight - this.prevImgH) > REPAINT_THRESHOLD) {
            //console.log("repainted ");
            this.canvas.height = this.img.clientHeight;
            this.canvas.width = this.img.clientWidth;
            this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
            //this.imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.scaleFactor = 1;
            this.prevImgH = newHeight;
            this.prevImgW = newWidth;
            changed = true;
        } else if (Math.abs((prevRatio / ratio) - 1) <= RATIO_SENSITIVITY && newHeight !== this.prevImgH) {
            this.scaleFactor = this.prevImgH ? (newHeight / this.prevImgH) : 0;
            changed = true;
        } else if (absOffset.left !== this.prevImgX || absOffset.top !== this.prevImgY) {
            changed = true;
        }
        this.prevImgX = absOffset.left;
        this.prevImgY = absOffset.top;
        if (!changed) {
            return;
        }
        for (var i = 0; i < this.tracing.length; i++) {
            //notify
            this.probe(this.tracing[i], true);
        }
    };

    this.probe = function (ele, eventIfChanged, forceEventAnyway) {
        var offset = cumulativeOffset(ele);
        var SEGMENTS = ele.detectionSegment ? ele.detectionSegment : this.detectionSegment;
        var h = (ele.clientHeight ? ele.clientHeight / 2 : 0) / this.scaleFactor;
        var w = (ele.clientWidth ? ele.clientWidth / 2 : 0) / this.scaleFactor;
        var x = (offset.left - this.prevImgX) / this.scaleFactor + w,
            y = (offset.top - this.prevImgY) / this.scaleFactor + h;
        var result = [0, 0, 0, 0];
        //check for boundary
        var samples = 0;
        for (var _x = x - w; _x < x + w ; _x += w / SEGMENTS) {
            for (var _y = y - h; _y < y + h ; _y += h / SEGMENTS) {
                if (_x >= 0 && _y >= 0 && (this.prevImgW - _x) >= 0 && (this.prevImgH - _y) >= 0) {
                    //we're inside img
                    samples++;
                    var tmp = this.ctx.getImageData(_x, _y, 1, 1).data;
                    result[0] += tmp[0];
                    result[1] += tmp[1];
                    result[2] += tmp[2];
                    result[3] += tmp[3];
                }
            }
        }
        if (!samples) result = [].concat(this.defColor);
        else {
            result[0] /= samples;
            result[1] /= samples;
            result[2] /= samples;
            result[3] /= samples;
            result[0] = Math.floor(result[0]);
            result[1] = Math.floor(result[1]);
            result[2] = Math.floor(result[2]);
            result[3] = Math.floor(result[3]);
        }
        if (!forceEventAnyway) {
            if (compArr(ele.underlyingColor_cache, result)) return result; //same
        }
        if (forceEventAnyway || eventIfChanged) {
            if (ele.underlyingColorChange) {
                ele.underlyingColorChange(result);
            }
            if (ele.dispatchEvent) {
                //    console.log(result);
                ele.dispatchEvent(new CustomEvent("underlyingColorChange", {
                    'detail': result
                }));
            }
            ele.underlyingColor_cache = result;
        }
        return result;
    };

    this.add = function (element) {
        this.tracing.push.call(this.tracing, element);
    };
}

//stores added instances
var _cache = [];

function _add() {
    var i = new imageCache();
    _cache.push(i);
    return i;
}

function _job(obj) {
    if (!obj) return;
    obj.update();
}

window.addEventListener("resize", function (e) {
    for (var i = 0; i < _cache.length; i++) {
        _job(_cache[i]);
    }
});

window.colorAt = _add;
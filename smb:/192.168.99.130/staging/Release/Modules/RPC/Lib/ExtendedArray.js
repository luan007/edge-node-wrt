var ExtendedArray = (function () {
    function ExtendedArray(initialCapacity) {
        var _this = this;
        this.freePos = [];
        this.push = function (d) {
            var pos = _this.data.length;
            if (_this.freePos.length > 0) {
                pos = _this.freePos.pop();
                _this.data[pos] = d;
                _this.generation[pos]++;
            }
            else {
                _this.data.push(d);
                _this.generation.push(0);
            }
            return pos;
        };
        this.data = new Array(initialCapacity || 2048);
        this.generation = new Array(initialCapacity || 2048);
        for (var i = this.data.length - 1; i >= 0; i--) {
            this.freePos.push(i);
            this.generation[i] = 0;
        }
    }
    ExtendedArray.prototype.pop = function (pos) {
        var data = this.data[pos];
        this.data[pos] = undefined;
        if (data) {
            this.freePos.push(pos);
        }
        return data;
    };
    ExtendedArray.prototype.age = function (pos) {
        return this.generation[pos];
    };
    return ExtendedArray;
})();
module.exports = ExtendedArray;

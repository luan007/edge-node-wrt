var store = require("../Storage");
exports.Table = undefined;
var TestModel = (function () {
    function TestModel() {
        this.id = 0;
    }
    TestModel.table = function () {
        if (!exports.Table) {
            exports.Table = store.DefineTable("TestModel", TestModel, { id: 'id' });
        }
        return exports.Table;
    };
    return TestModel;
})();
exports.TestModel = TestModel;

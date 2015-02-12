import orm = require("orm");
import store = require("../Storage");

export interface ITestModel extends TestModel, orm.Instance { }
export var Table: orm.Typed.TypedModel<ITestModel> = undefined; //YOU HAVE TO SET THIS MAN

export class TestModel {

    id: number = 0;

    static table(): orm.Typed.TypedModel<ITestModel> {
        if (!Table) {
            Table = <any>store.DefineTable("TestModel", TestModel, { id: 'id' });
        }
        return Table;
    }

}
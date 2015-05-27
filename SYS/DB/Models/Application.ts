import orm = require("orm");
import store = require("../Storage");

export interface IApplication extends Application, orm.Instance {
}
export var Table:orm.Typed.TypedModel<IApplication> = undefined; //YOU HAVE TO SET THIS MAN

export class Application {

    uid:string = "";

    appsig:string = "";

    name:string = "";

    urlName:string = "";

    static table():orm.Typed.TypedModel<IApplication> {
        if (!Table) {
            Table = <any>store.DefineTable("Application", Application, {id: ["uid"]});
        }
        return Table;
    }

    static Strip(App:Application):Application {
        return <Application>{
            uid: App.uid
        };
    }
}
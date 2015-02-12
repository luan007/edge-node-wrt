///<reference path="../Include/global.d.ts"/>
///<reference path="../Modules/Shared/export.d.ts"/>

declare var SERVER: ExpressApplication;

interface ExpressServerRequest {
    router: any;
    ticket: any;
    device: any;
}

declare function post(route: any, routeCallBack: (req: ExpressServerRequest, res: ExpressServerResponse, next: Function) => any): any;
declare function put(route: any, routeCallBack: (req: ExpressServerRequest, res: ExpressServerResponse, next: Function) => any): any;
declare function del(route: any, routeCallBack: (req: ExpressServerRequest, res: ExpressServerResponse, next: Function) => any): any;
declare function get(route: any, routeCallBack: (req: ExpressServerRequest, res: ExpressServerResponse, next: Function) => any): any;
declare function throwIf(condition: boolean, errormsg?: Error | string | any);
declare function requireAuth(req);
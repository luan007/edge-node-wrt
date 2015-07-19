
/// <reference path="./node.d.ts" />


/*
 * 
 * Freely use and distribute this :p
 * Have fun :)
 * 
 * Many thanks to nginx-conf
 * 
 * Mike Luan
 *  
 */


declare module 'nginx-conf' {

    export interface INginxConfFile {
        create(file, options, callback: (err, ngx : INginxConf) => any);
        create(file, callback: (err, ngx: INginxConf) => any);
        createFromSource(source, options, callback: (err, ngx: INginxConf) => any);
        createFromSource(source, callback: (err, ngx: INginxConf) => any);
    }


    export interface INginxConf extends NodeJS.EventEmitter {
        nginx: INginxConfNode;
        _name: string;
        tab: string;
        files: string[];
        liveListener();
        flush();
        die(fileName?);
        live(fileName?);
        toString(): string;
    }


    export interface _add_base extends INginxConfNode {
        (key, val?): INginxConfNode;
    }

    export interface _remove_base extends INginxConfNode {
        (key, index?);
    }

    export interface _getString_base extends INginxConfNode {
        (): string;
    }

    export interface _toString_base extends INginxConfNode {
        (): string;
    }

    export interface INginxConfNode {
        _root: any;
        _add: _add_base;
        _remove: _remove_base;
        _getString: _getString_base;
        _value: any;
        [key: string]: INginxConfNode;
        [key: number]: INginxConfNode;
    }




    export var version: string;

    export function parseFile(file, encoding, callback: (err, ngx: INginxConf) => any);

    export function parse(source, callback: (err, ngx: INginxConf) => any);

    export var NginxConfFile: INginxConfFile;
}
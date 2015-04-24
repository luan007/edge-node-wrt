import events = require('events');
import _Status = require('./Status');
import Status = _Status.Status;

var _statusCollection:{ [key: string]: Status; } = {};

export function Set(key, status){
    _statusCollection[key] = status;
}

export function Get(key){
    return _statusCollection[key];
}
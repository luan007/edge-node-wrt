/// <reference path="../Include/global.d.ts"/>
var app = require('app');
var fs = require('fs');
var net = require('net');

var BrowserWindow = require('browser-window'); 

var mainWindow = null;

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({frame: false});
  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});

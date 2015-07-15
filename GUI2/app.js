/// <reference path="typings/node/node.d.ts"/>
var app = require('app');
var fs = require('fs');

fs.writeFileSync('/var/GUI', process.pid);

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

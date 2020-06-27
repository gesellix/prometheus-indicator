"use strict";

const {ipcMain, nativeImage} = require('electron');
const config = require('./config').load();

const iconPath = __dirname + "/assets/icons";
const mb = require('menubar').menubar({
  dir: __dirname + "/src",
  icon: iconPath + "/good@2x.png",
  tooltip: "Prometheus Alerts",
  preloadWindow: false,
  supportsTrayHighlightState: true,
  browserWindow: {
    webPreferences: {nodeIntegration: true},
  }
});

// mb:
// {
//   app: the electron require('app') instance,
//   window: the electron require('browser-window') instance,
//   tray: the electron require('tray') instance,
//   positioner: the electron-positioner instance,
//   setOption(option, value): change an option after menubar is created,
//   getOption(option): get an menubar option,
//   showWindow(): show the menubar window,
//   hideWindow(): hide the menubar window
// }

const iconPathByStatus = {
  '': iconPath + "/unknown-error@2x.png",
  'unknown-error': iconPath + "/unknown-error@2x.png",
  'ok': iconPath + "/good@2x.png",
  'warning': iconPath + "/bad@2x.png",
  'critical': iconPath + "/bad@2x.png"
};

function updateStatusIndicator(status) {
  if (!!iconPathByStatus[status]) {
    let image = nativeImage.createFromPath(iconPathByStatus[status]);
    mb.tray.setImage(image);
  }
// todo else -> show 'status unknown' icon
}

const prom = require('./src/prometheus-alerts');

function updateAlerts() {
  prom.run(config, (result, error) => {
    if (error) {
      console.log('error', error);
      updateStatusIndicator('unknown-error');
      mb.window.webContents.send('error', error);
    }

    if (result) {
      console.log('result', result);
      updateStatusIndicator(result.status);
      mb.window.webContents.send('update', result.status, result.alerts);
    }
  });
}

ipcMain.on('renderer-mounted', (event, data) => {
  event.sender.send('config', config)
})

mb.on('ready', function ready() {
  console.log('app is ready');
  updateAlerts();
  setInterval(updateAlerts, config.pollInterval);
});

mb.on('after-create-window', function () {
  console.log('after-create-window');
  // mb.window.openDevTools();
  // console.log(mb.window.webContents);

  mb.app.on('web-contents-created', function (e, webContents) {
    console.log('web-contents-created');
  });
});

// mb.once('show', function() {
// console.log('once(show)');
//mb.window.openDevTools();
// });

// mb.on('show', function () {
//   console.log('show');
//   mb.window.openDevTools();
// });

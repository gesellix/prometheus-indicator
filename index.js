"use strict";

const iconPath = __dirname + "/images/icons";

const menubar = require('menubar');
const mb = menubar({
  dir: __dirname + "/src",
  icon: iconPath + "/good@2x.png",
  tooltip: "Prometheus Alerts",
  preloadWindow: false,
  supportsTrayHighlightState: true
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

const config = require('./config');
const prom = require('./src/prometheus-alerts');

function statusGood() {
  let NativeImage = require('electron').nativeImage;
  let image = NativeImage.createFromPath(iconPath + "/good@2x.png");
  mb.tray.setImage(image);
}

function statusBad() {
  let NativeImage = require('electron').nativeImage;
  let image = NativeImage.createFromPath(iconPath + "/bad@2x.png");
  mb.tray.setImage(image);
}

function statusUgly() {
  let NativeImage = require('electron').nativeImage;
  let image = NativeImage.createFromPath(iconPath + "/bad@2x.png");
  mb.tray.setImage(image);
}

const iconUpdaterByStatus = {
  'ok': statusGood,
  'warning': statusBad,
  'critical': statusUgly
};

function updateAlerts() {
  prom.run(config, (result, error) => {
    if (error) {
      console.log('error', error);
      mb.window.webContents.send('error', error);
    }

    if (result) {
      if (iconUpdaterByStatus[result.status]) {
        iconUpdaterByStatus[result.status]();
      }

      console.log('result', result);
      mb.window.webContents.send('update', result.status, result.alerts);
    }
  });
}

mb.on('ready', function ready() {
  console.log('app is ready');

  updateAlerts();
  setInterval(updateAlerts, 5000);
});

// mb.on('after-create-window', function ready() {
//   console.log('after-create-window');
//   mb.window.openDevTools();
// });

// mb.once('show', function () {
//   console.log('once(show)');
//   mb.window.openDevTools();
// });

// mb.on('show', function () {
//   console.log('show');
//   mb.window.openDevTools();
// });

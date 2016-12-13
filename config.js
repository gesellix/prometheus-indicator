(function () {
  "use strict";

  const settings = require('electron-settings');
  settings.defaults({
    alertmanager: {
      title: "Prometheus Alerts",
      baseUri: "http://localhost:9093"
    }
  });

// settings.set('alertmanager', {
//   baseUri: "http://example.com"
// }).then(() => {
//   settings.get('alertmanager.baseUri').then(val => {
//     console.log(val);
//     // => "Cosmo"
//   });
// });
  console.log('settings:', settings.getSettingsFilePath());

  module.exports = {
    load: () => {
      return settings.getSync('alertmanager');
    }
  }
}());

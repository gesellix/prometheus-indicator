(function () {
  "use strict";

  const Store = require('electron-store');
  const settings = new Store({
    defaults: {
      alertmanager: {
        title: "Prometheus Alerts",
        baseUri: "http://localhost:9093",
        pollInterval: 5000
      }
    }
  });
  console.log('settings file:', settings.path);
  console.log('settings', settings.get("alertmanager"));

  module.exports = {
    load: () => {
      return settings.get("alertmanager");
    }
  }
}());

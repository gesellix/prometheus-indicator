(function () {
  "use strict";
  const {ipcRenderer} = require('electron');

  module.exports = (model) => {
    model = model || {};

    const init = () => {

      ipcRenderer.on('error', function (e, error) {
        console.log('on error', e, error);

        model.error = error;
      });

      ipcRenderer.on('update', function (e, status, alerts) {
        console.log('on update', e, status, alerts);

        model.status = status;
        model.alerts = alerts;
      });
    };

    init();

    return {};
  };
}());

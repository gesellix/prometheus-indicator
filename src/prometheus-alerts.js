(function () {
  "use strict";
  const _ = require('lodash');
  const Q = require('q');
  const request = require('request');

  module.exports = {

    run: (alertmanager, cb) => {
      if (!_.has(alertmanager, 'baseUri')) { return cp(null, "Please specify Prometheus Alertmanager base URI (alertmanager.baseUri).")}

      const requestPrometheusAlertmanager = function () {
        const deferred = Q.defer();
        jsonRequest(alertmanager.baseUri + "/api/v1/alerts/groups", function (error, json) {
          if (error) {
            deferred.reject(error);
          }
          else {
            deferred.resolve(json);
          }
        });
        return deferred.promise;
      };

      requestPrometheusAlertmanager().then(
        function (jsonResponse) {
          const alerts = collectAlerts(jsonResponse.data);
          console.log(alerts);

          const status = {title: (config.title || ""), status: 'ok', alerts: []};
          const criticalAlerts = _.filter(alerts, {severity: 'critical', silenced: false});
          const warningAlerts = _.filter(alerts, {severity: 'warning', silenced: false});

          if (!_.isEmpty(criticalAlerts)) {
            status.status = 'critical';
            status.alerts = convertToMessages(criticalAlerts)
          }
          else if (!_.isEmpty(warningAlerts)) {
            status.status = 'warning';
            status.alerts = convertToMessages(warningAlerts)
          }
          cb(status, null);
        },
        function (error) {
          console.log(error);
          cb(null, "can't get prometheus alertmanager alerts");
        }
      );

      function jsonRequest(options, callback) {
        request(options, function (err, response, body) {
          if (err || !response || response.statusCode != 200) {
            err = (err || (response ? ("bad statusCode: " + response.statusCode) : "bad response")) + " from " + options.url;
          }
          let jsonBody;
          try {
            jsonBody = JSON.parse(body);
          }
          catch (e) {
            if (!err) {
              err = 'invalid json response';
            }
          }
          callback(err, jsonBody, response);
        });
      }

      function collectAlerts(json) {
        return _.flattenDeep(_.map(json, function (d) {
          return _.map(d.blocks, function (block) {
            return _.map(block.alerts, function (alert) {
              return {
                "severity": alert.labels.severity,
                "env": alert.labels.env,
                "alertname": alert.labels.alertname,
                "human_readable_context_name": alert.labels.human_readable_context_name,
                "silenced": alert.hasOwnProperty('silenced')
              };
            });
          });
        }));
      }

      function convertToMessages(alerts) {
        return _(alerts).map(convertToMessage).value();
      }

      function convertToMessage(alert) {
        return [alert.env.toUpperCase(), alert.alertname, alert.human_readable_context_name].join(" ").trim();
      }
    }
  };
}());

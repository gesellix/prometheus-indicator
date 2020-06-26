(function () {
  "use strict";
  const _ = require('lodash');
  const Q = require('q');
  const request = require('request');

  module.exports = {

    run: (alertmanager, cb) => {
      if (!_.has(alertmanager, 'baseUri')) {
        return cb(null, "Please specify Prometheus Alertmanager base URI (alertmanager.baseUri).")
      }

      const requestPrometheusAlertmanager = function () {
        const deferred = Q.defer();
        jsonRequest(alertmanager.baseUri + "/api/v2/alerts?silenced=false&inhibited=false", function (error, json) {
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
          var summary = _
            .chain(jsonResponse)
            .groupBy(function (alert) {
              if (alert.labels.severity === 'critical' || _.includes(['P1', 'P2'], alert.labels.priority)) {
                return 'critical';
              }
              else if (alert.labels.severity === 'warning' || _.includes(['P3', 'P4', 'P5'], alert.labels.priority)) {
                return 'warning';
              }
            })
            .thru(function (alertsBySeverity) {
              var criticals = alertsBySeverity['critical'];
              if (!_.isEmpty(criticals)) {
                return criticals;
              }
              var warnings = alertsBySeverity['warning'];
              if (!_.isEmpty(warnings)) {
                return warnings;
              }
              return [];
            })
            .reduce(function (status, alert) {
              status.status = alert.labels.severity || 'warning';
              status.alerts.push(convertToMessage(alert));
              return status;
            }, {
              status: 'ok',
              alerts: [],
            })
            .value();
          cb(summary, null);
        },
        function (error) {
          console.log('error:', error);
          cb(null, "can't get prometheus alertmanager alerts");
        }
      )

      function jsonRequest(options, callback) {
        request(options, function (err, response, body) {
          if (err || !response || response.statusCode !== 200) {
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

      function convertToMessage(alert) {
        if (alert.annotations && alert.annotations['teamwall_summary']) {
          return alert.annotations['teamwall_summary'];
        }
        else {
          return [
            alert.labels.env ? alert.labels.env.toUpperCase() : '',
            alert.labels.alertname,
            alert.labels.human_readable_context_name
          ].join(' ').trim();
        }
      }
    }
  };
}());

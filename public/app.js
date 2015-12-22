"use strict";

var app = angular.module('IndexApp', [ 'ngRoute', 'ui-rangeSlider', 'googlechart' ]);

app.factory('dateUtil', lib.DateUtil);

app.factory('rest', lib.RestHelper);

app.filter('dateFormat', function($filter) {
  return function(input) {
    if(input == null){ return ""; }
    var _date = $filter('date')(new Date(input), 'dd.MM.yy HH:MM');
    return _date.toString();
  };
});

app.filter('minutesAgo', function () {
  return function (input) {
    input = (Date.now() - input) / 1000;
    function z(n) { return (n < 10 ? '0' : '') + n; }
    var seconds = Math.floor(input % 60);
    var minutes = Math.floor(input % 3600 / 60);
    var hours = Math.floor(input / 3600);
    if (hours < 1 && minutes < 2) {
      return "aktuell";
    } else if (hours < 1) {
      return "vor " + minutes + " Minuten";
    } else {
      return hours + ':' + z(minutes) + ' her';
    }
  };
});

app.directive('serverStats', function() {
  return {
    template: 'Uptime: {{serverUptime}} | CPU0: {{serverTemp}} degC | MemAvailable: {{serverMemAvail}} <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true" ng-show="longLoadProcess">'
  };
});

app.directive('widgets', function(rest) {
  return {
    template:
    '<div ng-repeat="a in lastByType">' +
    '  <b>{{a.value}} {{a.unit}}</b> bei <a href="#/showDevice/{{a.device_id}}">{{a.device_id}}</a> <a href="#/showDevice/{{a.device_id}}/{{a.key}}">{{a.keyNice}}</a> ({{a.timestamp | minutesAgo}})' +
    '</div>'
  };
});

app.controller('MainCtrl', function(rest, $scope, $timeout, $interval, $route, $routeParams, $location) {
  $scope.infoBoxDisabled = true;
  $scope.$on('$locationChangeSuccess', function(evt, absNewUrl, absOldUrl) {
    $scope.lastPath = absOldUrl.split("#")[1];
    if ($scope.infoBoxFrom != absNewUrl) {
      $scope.infoBoxText = "";
      $scope.infoBoxShow = false;
    }
  });

  $scope.$on('infoBox', function(event, args) {
    $scope.infoBoxText = args.text;
    $scope.infoBoxShow = true;
    $scope.infoBoxFrom = args.from;
  });

  $scope.$on('removeInfoBox', function(event, args) {
    $scope.infoBoxText = "";
    $scope.infoBoxShow = false;
  });

  $scope.$on('startLongLoad', function(event, args) {
    $scope.longLoadProcess = true;
  });

  $scope.$on('stopLongLoad', function(event, args) {
    $scope.longLoadProcess = false;
  });

  var getUpdates = function() {
    var updateServiceUrl = "lastUpdate";
    rest.getURL(updateServiceUrl).then(function(promise) {
      $scope.updates = promise.data;
      $scope.updateTableCSS = "glow";
      $timeout(function() {$scope.updateTableCSS = "";}, 1500);
    });

    var tempServiceUrl = "system/temperature";
    rest.getURL(tempServiceUrl).then(function(promise) {
      $scope.serverTemp = parseInt(promise.data.cpuTemp) / 1000;
    });

    var memServiceUrl = "system/mem";
    rest.getURL(memServiceUrl).then(function(promise) {
      $scope.serverMemAvail = promise.data.memAvailable;
    });

    var uptimeUrl = "system/uptime";
    rest.getURL(uptimeUrl).then(function(promise) {
      $scope.serverUptime = promise.data.uptime;
    });

    rest.getURL("datatypes").then(function(typePromise) {
      $scope.lastByType = $scope.lastByType || [];
      for (var t = 0; t < typePromise.data.length; t++) {
        var aType = typePromise.data[t]
        var newest = "newestKeysEndingWith/_" + aType.sufix;
        rest.getURLWithIndex(newest, null, aType).then(function(dataPromise) {
          $scope.lastByType[dataPromise.config.index.name] = [];
          for (var i = 0; i < dataPromise.data.length; i++) {
            var aDataPoint = {};
            aDataPoint.value = dataPromise.data[i].value;
            aDataPoint.unit =  dataPromise.config.index.unit;
            aDataPoint.device_id = dataPromise.data[i]._id.device_id;
            aDataPoint.keyNice = dataPromise.data[i]._id.key.substring(0,dataPromise.data[i]._id.key.length - dataPromise.config.index.sufix.length - 1);
            aDataPoint.key = dataPromise.data[i]._id.key;
            aDataPoint.timestamp = dataPromise.data[i].lastDate;
            var found = false;
            for (var f = 0; f < $scope.lastByType.length; f++) {
              if (($scope.lastByType[f].device_id === aDataPoint.device_id) &&
                  ($scope.lastByType[f].key === aDataPoint.key)) {
                found = true;
                $scope.lastByType[f] = aDataPoint;
              }
            }
            if (!found) {
              $scope.lastByType.push(aDataPoint);
            }
          }
        })}
    });
  };
  $interval(getUpdates, 30000);
  getUpdates();
});

app.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('/showDevices', {
    templateUrl : 'view/devicesView.html',
    controller : 'devicesCtrl'
  }).when('/showDevice/:id', {
    templateUrl : 'view/deviceView.html',
    controller : 'deviceCtrl'
  }).when('/showDevice/:id/:key', {
    templateUrl : 'view/deviceView.html',
    controller : 'deviceCtrl'
  }).when('/showDebug', {
    templateUrl : 'view/debugView.html',
    controller : 'debugCtrl'
  }).when('/showManualInput', {
    templateUrl : 'view/manualInputView.html',
    controller : 'manualInputCtrl'
  }).when('/showDelete/:device_id/:id', {
    templateUrl : 'view/deleteView.html',
    controller : 'deleteCtrl'
  }).when('/showDeleteDevice/:device_id', {
    templateUrl : 'view/deleteDeviceView.html',
    controller : 'deleteDeviceCtrl'
  }).when('/showAddDatatype', {
    templateUrl : 'view/addDatatypeView.html',
    controller : 'addDatatypeCtrl'
  }).when('/showUpdates', {
    templateUrl : 'view/updatesView.html'
  }).when('/', {
    templateUrl : 'view/helloView.html'
  }).otherwise({
    redirectTo : "/"
  });
});

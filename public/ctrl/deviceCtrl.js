angular.module('IndexApp').controller('deviceCtrl', function(rest, dateUtil, $scope, $location, $routeParams, $q) {
  $scope.deviceId = $routeParams.id;
  $scope.data = [];
  $scope.mapLink = "white.png";
  $scope.showChart = false;
  $scope.showMap = false;
  $scope.selectedKey = "";
  $scope.dayWeekAll = "day";
  $scope.range = null;

  $scope.updateRange = function (key) {
    $scope.range.forEach( function (e, i, a)  {
      if (e._id == key) {
        var min = parseInt(e.MIN_TS);
        var max = parseInt(e.MAX_TS);
        $scope.min = $scope.sliderMin = $scope.sliderAbsMin = min;
        $scope.max = $scope.sliderMax = max;
      }
    });
  }

  // Verfügbarer Zeitraum
  var rangeURL = "{deviceid}/range".replace("{deviceid}", $scope.deviceId);
  var rangePromise = rest.getURL(rangeURL).then(function(promise) {
    $scope.range = promise.data;
    $scope.keys = [];
    $scope.range.forEach( function (e, i, a)  {
      $scope.keys.push(e._id);
    });

    if ($routeParams.key) {
      $scope.selectedKey = $routeParams.key;
    } else {
      $scope.selectedKey = $scope.keys[0];
    }

    $scope.updateRange($scope.selectedKey);
    var hoursAgo24 = $scope.max - 24 * 60 * 60 * 1000;
    if ($scope.min < hoursAgo24) {
      $scope.min = hoursAgo24;
    }
  });

  $scope.keySelected = function() {
    $scope.updateRange($scope.selectedKey);
    $scope.reload();
  }

  // Daten laden
  $scope.reload = function() {
    if (angular.isString($scope.selectedKey) && $scope.selectedKey.length > 0) {
      $scope.$emit('startLongLoad');
      var dataURL = "{deviceid}/{key}/{from}/{to}";
      dataURL = dataURL.replace("{deviceid}", $scope.deviceId);
      dataURL = dataURL.replace("{key}", $scope.selectedKey);
      dataURL = dataURL.replace("{from}", $scope.min);
      dataURL = dataURL.replace("{to}", $scope.max);
      rest.getURL(dataURL).then(function(promise) {
        $scope.data = promise.data;
        chooseChart();
      });
    }
  };

  // Slider neu laden, wenn zwischen Tag Woche und allen Daten gwechselt wurde
  $scope.reloadSlider = function() {
    if (angular.isString($scope.dayWeekAll) && $scope.dayWeekAll.length > 0) {
      $scope.$emit('removeInfoBox');
      var hoursAgo24 = new Date() - 24 * 60 * 60 * 1000;
      var weekAgo = new Date() - 24 * 60 * 60 * 1000 * 7;
      if ($scope.dayWeekAll == "day") {
        if ($scope.sliderAbsMin <= hoursAgo24 && $scope.sliderMax > hoursAgo24) {
          $scope.sliderMin = hoursAgo24;
          $scope.min = hoursAgo24;
          $scope.reload();
        } else {
          $scope.$emit('infoBox', {
            text : "Es sind noch nicht genügend Daten für diese Ansicht vorhanden."
          });
        }
      } else if ($scope.dayWeekAll == "week") {
        if ($scope.sliderAbsMin <= weekAgo && $scope.sliderMax > weekAgo) {
          $scope.sliderMin = weekAgo;
          $scope.min = weekAgo;
          $scope.reload();
        } else {
          $scope.$emit('infoBox', {
            text : "Es sind noch nicht genügend Daten für diese Ansicht vorhanden."
          });
        }
      } else if ($scope.dayWeekAll == "all") {
        $scope.min = $scope.sliderMin = $scope.sliderAbsMin;
        $scope.reload();
      }
    }
  };

  $scope.addDisplay = function() {
    if (angular.isString($scope.selectedKey) && $scope.selectedKey.length > 0) {
      var uRL = "display/{line}";
      uRL = uRL.replace("{line}", $scope.addToDisplayLine);
      rest.postURL(uRL, {device_id:$scope.deviceId, key:$scope.selectedKey}).then(function(promise) {
        $scope.$emit('infoBox', {
          text : "Hinzugefügt als Zeile " + ($scope.addToDisplayLine + 1),
          from : $location.absUrl()
        });
      });
    }
  };

  // Here data which seems like it only has binary states (0,
  // 1) gets
  // padded so that it looks like "switch on - switch off" by
  // adding a
  // 0 a minimum amount of time befor 0 -> 1 transition an
  // 1 a minimum amount of time befor 1 -> 0 transition
  var padDataAsStateDiagramm = function() {
    var lastV = 2;
    var lastTS = 0;
    for (var i = 0; i < $scope.data.length; i++) {
      var v = parseInt($scope.data[i].value);
      var ts = $scope.data[i].timestamp;
      if (lastV === 1 && v === 0 && (ts - 1 > lastTS)) {
        $scope.data.splice(i, 0, {
          "value" : 1,
          "timestamp" : (ts - 1)
        });
      }
      if (lastV === 0 && v === 1 && (ts - 1 > lastTS)) {
        $scope.data.splice(i, 0, {
          "value" : 0,
          "timestamp" : (ts - 1)
        });
      }
      lastV = v;
      lastTS = ts;
    }
  };

  // This creates a linechart based on the data in $scope.data
  var createNumericChart = function() {
    $scope.gcRows = [];
    for (var i = 0; i < $scope.data.length; i++) {
      $scope.gcRows.push({
        "c" : [ {
          "v" : new Date($scope.data[i].timestamp),
          "f" : dateUtil.germanDateTime(new Date($scope.data[i].timestamp))
        }, {
          "v" : $scope.data[i].value,
          "f" : $scope.data[i].value
        } ],
      });
    }

    $scope.chartObject = {
      "type" : "LineChart",
      "displayed" : $scope.lineChartVisible,
      "data" : {
        "cols" : [ {
          "id" : "Uhrzeit",
          "label" : "Uhrzeit",
          "type" : "date",
          "p" : {}
        }, {
          "id" : "Wert",
          "label" : "Wert",
          "type" : "number",
          "p" : {}
        } ],
        "rows" : $scope.gcRows
      },
      "options" : {
        "fill" : 20,
        "displayExactValues" : true,
        "vAxis" : {
          "title" : "Wert",
          "gridlines" : {
            "count" : 10
          }
        },
        'chartArea': {
          'backgroundColor': {
            'fill': '#ffffff',
            'opacity': 100
          },
        },
        legend: {position: 'none'},
        "hAxis" : {
          "title" : "Zeit"
        }
      },
      "formatters" : {}
    };
  };

  // This creates a map using the google map static chart api
  var createMapChart = function() {
    var points = [];
    for (var i = 0; i < $scope.data.length; i++) {
      points.push({
        "Lon" : parseFloat($scope.data[i].value.split(";")[1]),
        "Lat" : parseFloat($scope.data[i].value.split(";")[0])
      });
    }
    $scope.mapLink = gmaps(points, 400, 200);
  };

  // creates google staticmap api link.
  // points: array of objects with Lon and Lat variables
  // w, h: map size in px
  // @see
  // https://developers.google.com/maps/documentation/staticmaps/?hl=de
  var gmaps = function(points, w, h) {
    var marker = [];
    marker.push("{lat},{lon}".replace("{lon}", points[0].Lon).replace("{lat}", points[0].Lat));
    if (points.length > 2) {
      var step = parseInt(points.length / 10) + 1;
      for (var i = 0; i < points.length; i += step) {
        marker.push("{lat},{lon}".replace("{lon}", points[i].Lon).replace("{lat}",
                                                                          points[i].Lat));
      }
    }
    if (points.length > 1) {
      marker.push("{lat},{lon}".replace("{lon}", points[points.length - 1].Lon).replace("{lat}",
                                                                                        points[points.length - 1].Lat));
    }
    return "http://maps.googleapis.com/maps/api/staticmap?&markers=color:blue%7Clabel:P%7C{marker}&size={w}x{h}&sensor=false"
    .replace("{marker}", marker.join("%7C")).replace("{h}", h).replace("{w}", w);
  };

  var configChartDisplay = function(chartVisible, mapVisible) {
    $scope.showChart = chartVisible;
    $scope.showMap = mapVisible;
    if (!mapVisible) {
      $scope.mapLink = "white.png";
    }
  };

  // Logic that determites wich chart to use
  var chooseChart = function() {
    var logMarker = "posLatLon";
    var isOnlyNumeric = true;
    var isOnlyZeroOne = true;

    if ($scope.data.length == 0) {
      configChartDisplay(false, false);
      $scope.$emit('stopLongLoad');
      return;
    } else if ($scope.selectedKey.substring(0, logMarker.length) === logMarker) {
      createMapChart();
      configChartDisplay(false, true);
      $scope.$emit('stopLongLoad');
      return;
    } else {
      for (var i = 0; i < $scope.data.length; i++) {
        var v = $scope.data[i].value;
        if (!(!isNaN(parseFloat(v) && isFinite(v)))) {
          isOnlyNumeric = false;
        }
        if (v != 1 && v != 0) {
          isOnlyZeroOne = false;
        }
      }
    }
    if (isOnlyZeroOne) {
      padDataAsStateDiagramm();
      $scope.$emit('stopLongLoad');
    }
    if (isOnlyNumeric) {
      createNumericChart();
      configChartDisplay(true, false);
      $scope.$emit('stopLongLoad');
    }
    $scope.$emit('stopLongLoad');
  };

  // We load the data only when the whole range and all the
  // keys are known
  $q.all([ rangePromise ]).then(function(result) {
    $scope.reload();
  }, function() {
    alert("Schlüssel oder Zeitraum kann nicht geladen werden.");
  });
});


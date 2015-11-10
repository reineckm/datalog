"use strict";

var app = angular.module('IndexApp', [ 'ngRoute', 'ui-rangeSlider', 'googlechart' ]);

app.factory('rest', function($http) {
    var arrayToQuerystring = function(params) {
	if (params) {
	    var qs = "?";
	    for (var i = 0; i < params.length; i++) {
		qs += params[i].key + "=" + params[i].value + "&";
	    }
	    return qs;
	}
	return "";
    };
    var rest = {
	queryURL : function(url, params) {
	    var baseUrl = document.location.origin + window.location.pathname + "rest/";
	    var targeturl = baseUrl + url + arrayToQuerystring(params);
	    console.log(targeturl);
	    return $http.get(targeturl);
	},
	postURL : function(url, data) {
	    var baseUrl = document.location.origin + window.location.pathname + "rest/";
	    var targeturl = baseUrl + url;
	    console.log(targeturl);
	    return $http.post(targeturl, data);
	},
	queryURLWithIndex : function(url, params, i) {
	    var baseUrl = document.location.origin + window.location.pathname + "rest/";
	    var targeturl = baseUrl + url + arrayToQuerystring(params);
	    var config = [];
	    config.index = i;
	    console.log(targeturl);
	    return $http.get(targeturl, config);
	},
	deleteURL : function(url) {
	    var baseUrl = document.location.origin + window.location.pathname + "rest/";
	    var targeturl = baseUrl + url;
	    console.log(targeturl);
	    return $http.delete(targeturl);
	}
    };
    return rest;
});

app.controller('showDevices', function(rest, $scope, $routeParams) {
    var deviceUrl = "deviceids";
    rest.queryURL(deviceUrl).then(function(promise) {
	$scope.devices = promise.data;
	for (var i = 0; i < $scope.devices.length; i++) {
	    var keysURL = "{deviceid}/keys".replace("{deviceid}", $scope.devices[i].device_id);
	    rest.queryURLWithIndex(keysURL, null, i).then(function(promise) {
		$scope.devices[promise.config.index].keys = promise.data;
	    });
	}
    });
});

app.controller('showDebug', function(rest, $scope, $routeParams) {
    var serviceUrl = "debug";
    rest.queryURL(serviceUrl).then(function(promise) {
	if (promise.data.length > 0) {
	    $scope.header = Object.keys(promise.data[0]);
	    $scope.rows = {
		rows : promise.data,
		cols : Object.keys(promise.data[0])
	    };
	}
    });
});

app
	.controller(
		'showDevice',
		function(rest, $scope, $routeParams, $q) {
		    $scope.deviceId = $routeParams.id;
		    $scope.data = [];
		    $scope.mapLink = "white.png";
		    $scope.showChart = false;
		    $scope.showMap = false;
		    $scope.selectedKey = {
				name : ""
		    };

		    // Verfügbarer Zeitraum
		    var rangeURL = "{deviceid}/range".replace("{deviceid}", $scope.deviceId);
		    var rangePromise = rest.queryURL(rangeURL).then(function(promise) {
				$scope.min = parseInt(promise.data.MIN_TS);
				$scope.sliderMin = parseInt(promise.data.MIN_TS);
				$scope.max = parseInt(promise.data.MAX_TS);
				$scope.sliderMax = parseInt(promise.data.MAX_TS);
		    });

		    // Verfügbare Keys
		    var keysURL = "{deviceid}/keys".replace("{deviceid}", $scope.deviceId);
		    var keyPromise = rest.queryURL(keysURL).then(function(promise) {
				$scope.keys = promise.data;
		    });

		    // Daten laden
		    $scope.reload = function() {
				var dataURL = "{deviceid}/{key}/{from}/{to}".replace("{deviceid}",
					$scope.deviceId).replace("{key}", $scope.selectedKey.name)
					.replace("{from}", $scope.min).replace("{to}", $scope.max);
				rest.queryURL(dataURL).then(function(promise) {
					$scope.data = promise.data;
					chooseChart();
				});
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
				    "f" : Date($scope.data[i].timestamp)
				}, {
				    "v" : $scope.data[i].value,
				    "f" : ""
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
				"hAxis" : {
				    "title" : "Date"
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
			    return;
			} else if ($scope.selectedKey.name.substring(0, logMarker.length) === logMarker) {
			    createMapChart();
			    configChartDisplay(false, true);
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
			}
			if (isOnlyNumeric) {
			    createNumericChart();
			    configChartDisplay(true, false);
			}
		    };

		    // We load the data first when the whole range and all the
		    // keys are
		    // known
		    $q.all([ rangePromise, keyPromise ]).then(function(result) {
			$scope.reload();
		    }, function() {
			alert("Schlüssel oder Zeitraum kann nicht geladen werden.");
		    });
		});

app.controller('showManualInput', function(rest, $scope, $routeParams) {
    $scope.send = function() {
	var data = {
		"key":$scope.key,
		"value":$scope.value,
		"timestamp":Date.now() 
	};
	var serviceUrl = $scope.deviceId;
	$scope.devices = rest.postURL(serviceUrl, data).then(function(promise) {
	    console.log(promise.data);
	    $scope.$emit('infoBox', {
		text : promise.data + " Datensätze eingefügt.",
	    });
	});
    };
});

app.controller('showDelete', function(rest, $scope, $routeParams, $location) {
    $scope.id = $routeParams.id;
    $scope.device_id = $routeParams.device_id;
    var serviceUrl = $routeParams.device_id + "/" + $routeParams.id;
    $scope.doDelete = function() {
	rest.deleteURL(serviceUrl).then(function(promise) {
	    $location.path($scope.lastPath);
	    $scope.$emit('infoBox', {
		text : "Gelöschte Einträge: " + promise.data.n,
		from : $location.absUrl()
	    });
	});
    };
});

app.controller('showDeleteDevice', function(rest, $scope, $routeParams, $location) {
    $scope.device_id = $routeParams.device_id;
    var serviceUrl = $routeParams.device_id;
    $scope.doDelete = function() {
	rest.deleteURL(serviceUrl).then(function(promise) {
	    $location.path($scope.lastPath);
	    $scope.$emit('infoBox', {
		text : "Gelöschte Einträge: " + promise.data.n,
		from : $location.absUrl()
	    });
	});
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

    var getUpdates = function() {
	var updateServiceUrl = "lastUpdate";
	rest.queryURL(updateServiceUrl).then(function(promise) {
	    $scope.updates = promise.data;
	    console.dir(promise.data);
	    $scope.updateTableCSS = "glow";
	    $timeout(function() {$scope.updateTableCSS = "";}, 1500);
	});
	
	var tempServiceUrl = "system/temperature";
	rest.queryURL(tempServiceUrl).then(function(promise) {
	    $scope.serverTemp = parseInt(promise.data.cpuTemp) / 1000;
	});
	
        var memServiceUrl = "system/mem";
        rest.queryURL(memServiceUrl).then(function(promise) {
            $scope.serverMemAvail = promise.data.memAvailable;
        });
    };
    $interval(getUpdates, 30000);
    getUpdates();
});

app.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/showDevices', {
	templateUrl : 'showDevices.html',
	controller : 'showDevices'
    }).when('/showDevice/:id', {
	templateUrl : 'showDevice.html',
	controller : 'showDevice'
    }).when('/showDebug', {
	templateUrl : 'showDebug.html',
	controller : 'showDebug'
    }).when('/showManualInput', {
	templateUrl : 'showManualInput.html',
	controller : 'showManualInput'
    }).when('/showDelete/:device_id/:id', {
	templateUrl : 'showDelete.html',
	controller : 'showDelete'
    }).when('/showDeleteDevice/:device_id', {
	templateUrl : 'showDeleteDevice.html',
	controller : 'showDeleteDevice'
    }).otherwise({
	redirectTo : "/"
    });
});

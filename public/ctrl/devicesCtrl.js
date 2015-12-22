angular.module('IndexApp').controller('devicesCtrl', function(rest, $scope, $routeParams) {
  var deviceUrl = "deviceids";
  rest.getURL(deviceUrl).then(function(promise) {
    $scope.devices = promise.data;
    for (var i = 0; i < $scope.devices.length; i++) {
      var keysURL = "{deviceid}/keys".replace("{deviceid}", $scope.devices[i].device_id);
      rest.getURLWithIndex(keysURL, null, i).then(function(promise) {
        $scope.devices[promise.config.index].keys = promise.data;
      });
    }
  });
});

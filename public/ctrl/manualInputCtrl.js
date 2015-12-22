
angular.module('IndexApp').controller('manualInputCtrl', function(rest, $scope, $routeParams) {
  $scope.send = function() {
    var data = {
      "key":$scope.key,
      "value":$scope.value,
      "timestamp":Date.now()
    };
    var serviceUrl = $scope.deviceId;
    $scope.devices = rest.postURL(serviceUrl, data).then(function(promise) {
      $scope.$emit('infoBox', {
        text : "Datensatz " + promise.data + "eingefügt."
      });
    });
  };
});

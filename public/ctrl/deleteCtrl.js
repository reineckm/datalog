angular.module('IndexApp').controller('deleteCtrl', function(rest, $scope, $routeParams, $location) {
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

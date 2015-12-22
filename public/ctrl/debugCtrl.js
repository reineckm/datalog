angular.module('IndexApp').controller('debugCtrl', function(rest, $scope, $routeParams) {
  var serviceUrl = "debug";
  rest.getURL(serviceUrl).then(function(promise) {
    if (promise.data.length > 0) {
      $scope.header = Object.keys(promise.data[0]);
      $scope.rows = {
        rows : promise.data,
        cols : Object.keys(promise.data[0])
      };
    }
  });
});

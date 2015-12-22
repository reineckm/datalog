angular.module('IndexApp').controller('addDatatypeCtrl', function(rest, $scope, $routeParams) {
  $scope.send = function(datatype) {
    $scope.devices = rest.postURL("datatypes", datatype).then(function(promise) {
      console.log(promise.data);
      $scope.$emit('infoBox', {
        text : "Datensatz " + promise.data + "eingefügt."
      });
    });
  };
});

var lib = lib || {}; // declare a new namespace for the shared code.

lib.DateUtil = function() {
  var util = {
    germanDateTime : function(date) {
      return date.getDate() + "." + date.getMonth() + "." + date.getYear() + " " + date.getHours() + ":" + date.getMinutes();
    },
    germanDate : function(date) {
      return date.getDate() + "." + date.getMonth() + "." + date.getYear();
    }
  };
  return util;
};

lib.RestHelper = function($http) {
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
  var baseUrl = document.location.origin + window.location.pathname + "rest/";
  var rest = {
    getURL : function(url, params) {
      var targeturl = baseUrl + url + arrayToQuerystring(params);
      return $http.get(targeturl);
    },
    getURLWithIndex : function(url, params, i) {
      var targeturl = baseUrl + url + arrayToQuerystring(params);
      var config = [];
      config.index = i;
      return $http.get(targeturl, config);
    },
    postURL : function(url, data) {
      var targeturl = baseUrl + url;
      return $http.post(targeturl, data);
    },
    deleteURL : function(url) {
      var targeturl = baseUrl + url;
      return $http.delete(targeturl);
    }
  };
  return rest;
};

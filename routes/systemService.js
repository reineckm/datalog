var sys = require('sys')
var exec = require('child_process').exec;
var os = require("os");

exports.temperature = function(req, res) {
  if (os.type() === "Linux") {
	  exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
		    res.send({cpuTemp:stdout});
	  });
  } else {
    res.send({cpuTemp:0});
  }
};


exports.memAvailable = function(req, res) {
  if (os.type() === "Linux") {
    exec("cat /proc/meminfo | grep MemAvailable", function (error, stdout, stderr) {
      res.send({memAvailable:stdout.split(":")[1].trim()});
    });
  } else {
    res.send({memAvailable:0});
  }
};


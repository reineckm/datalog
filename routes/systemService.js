var sys = require('sys')
var exec = require('child_process').exec;

exports.temperature = function(req, res) {
	exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) { 
		res.send({cpuTemp:stdout});
	});
};


exports.memAvailable = function(req, res) {
        exec("cat /proc/meminfo | grep MemAvailable", function (error, stdout, stderr) {
                res.send({memAvailable:stdout.split(":")[1].trim()});
        });
};


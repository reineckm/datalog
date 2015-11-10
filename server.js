var express = require('express'),
    dataLogService = require('./routes/dataLogService');
    systemService = require('./routes/systemService');

var app = express();

app.configure(function () {
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
	app.use(express.static('public'));
});

app.get('/rest/system/temperature', systemService.temperature);

app.get('/rest/debug', dataLogService.debug);
app.get('/rest/lastUpdate', dataLogService.lastUpdate);
app.get('/rest/deviceids', dataLogService.deviceids);
app.get('/rest/:device_id/keys', dataLogService.keys);
app.get('/rest/:device_id/range', dataLogService.range);
app.get('/rest/:device_id/:key/:from/:to', dataLogService.valuesPerDevicePerKeyInRange);

app.post('/rest/:device_id', dataLogService.addDatapoint);

app.delete('/rest/:device_id', dataLogService.deleteDevice);
app.delete('/rest/:device_id/:id', dataLogService.deleteDatapoint);

app.listen(3000);
console.log('Listening on port 3000...');
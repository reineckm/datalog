var express = require('express'),
    dataLogService = require('./routes/dataLogService'),
    datatypeService = require('./routes/datatypeService'),
    systemService = require('./routes/systemService');

var app = express();

app.configure(function () {
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
});

app.get('/rest/system/temperature', systemService.temperature);
app.get('/rest/system/mem', systemService.memAvailable);
app.get('/rest/system/uptime', systemService.uptime);

app.get('/rest/datatypes', datatypeService.getDatatype);
app.post('/rest/datatypes', datatypeService.addDatatype);

app.get('/rest/debug', dataLogService.debug);
app.get('/rest/lastUpdate', dataLogService.lastUpdate);
app.get('/rest/deviceids', dataLogService.deviceids);
app.get('/rest/:device_id/keys', dataLogService.keys);
app.get('/rest/:device_id/range', dataLogService.range);
app.get('/rest/:device_id/:key/:from/:to', dataLogService.valuesPerDevicePerKeyInRange);
app.get('/rest/newestKeysEndingWith/:token', dataLogService.newestKeysEndingWith);
app.post('/rest/:device_id', dataLogService.addDatapoint);
app.delete('/rest/:device_id', dataLogService.deleteDevice);
app.delete('/rest/:device_id/:id', dataLogService.deleteDatapoint);

app.listen(3000);
console.log('Listening on port 3000...');

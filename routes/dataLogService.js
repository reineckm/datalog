var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('datalogdb', server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'datalogdb' database");
        db.collection('datapoints', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'datapoints' collection doesn't exist. Creating it...");
                populateDB();
            }
        });
    }
});

exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving id: ' + id);
    db.collection('datapoints', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.debug = function(req, res) {
    db.collection('datapoints', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.lastUpdate = function(req, res) {
	var oneHourAgo = Date.now() - 3600000;
    db.collection('datapoints', function(err, collection) {
        collection.find({
			timestamp: {
				$gte: oneHourAgo
			}
		}).toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.deviceids = function(req, res) {
    db.collection('datapoints', function(err, collection) {
        collection.distinct("device_id", function(err, items) {
			var obj = items.reduce(function(o, v, i) {
				console.log(o);
			    o.r.push({"device_id" : v});
				return o;
			}, {r:[]});
            res.send(obj.r);
        });
    });
};

exports.keys = function(req, res) {
    forId = req.params.device_id;
	db.collection('datapoints', function(err, collection) {
        collection.distinct("key", {device_id:forId}, function(err, items) {
            res.send(items);
        });
    });
};

exports.range = function(req, res) {
    forId = req.params.device_id;
	db.collection('datapoints', function(err, collection) {
		collection.aggregate([
			{ $group: { '_id':forId , 'MIN_TS': {'$min': "$timestamp" }, 'MAX_TS': {'$max': "$timestamp" } } }
		]).toArray(function(err, items) {
			res.send(items[0]);
		})
	});
};

exports.valuesPerDevicePerKeyInRange = function(req, res) {
	var query = {
			device_id: req.params.device_id,
			key: req.params.key,
			timestamp: {
				$gte: parseInt(req.params.from),
				$lte: parseInt(req.params.to)
			}
	}
	db.collection('datapoints', function(err, collection) {
		collection.find(query).toArray(function(err, items) {
			res.send(items);
		})
	});
};

exports.addDatapoint = function(req, res) {
    var datapoint = req.body;
	datapoint.device_id = req.params.device_id;
    console.log('Adding datapoint: ' + JSON.stringify(datapoint));
    db.collection('datapoints', function(err, collection) {
        collection.insert(datapoint, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

exports.updateDatapoint = function(req, res) {
    var id = req.params.id;
    var wine = req.body;
    console.log('Updating datapoint: ' + id);
    console.log(JSON.stringify(wine));
    db.collection('datapoints', function(err, collection) {
        collection.deleteOne({'_id':new BSON.ObjectID(id)}, wine, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating datapoint: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(wine);
            }
        });
    });
}

exports.deleteDevice = function(req, res) {
    var device_id = req.params.device_id;
    console.log('Deleting device: ' + device_id);
    db.collection('datapoints', function(err, collection) {
        collection.remove({'device_id': device_id}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

exports.deleteDatapoint = function(req, res) {
    var device_id = req.params.device_id;
    var id = req.params.id;
    console.log(new mongo.ObjectId(id));
	db.collection('datapoints', {}, function(err, collection) {
        collection.remove({_id: new mongo.ObjectId(id)}, function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(result);
            }
        });
    });    
}

var populateDB = function() {

    var datapoints = [
    {
        device_id: "Testdevice",
        key: "Testpoints A",
        value: "1",
        timestamp: Date.now() - 1000
    },
    {
        device_id: "Testdevice",
        key: "Testpoints A",
        value: "3",
        timestamp: Date.now()
    },
    {
        device_id: "Testdevice",
        key: "Testpoints B",
        value: "1",
        timestamp: Date.now()
    }];

    db.collection('datapoints', function(err, collection) {
        collection.insert(datapoints, {safe:true}, function(err, result) {});
    });
};
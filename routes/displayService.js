var unirest = require('unirest');
var mongo = require('mongodb');
var async = require('async');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('datalogdb', server);

db.open(function(err, db) {
  if(!err) {
    console.log("Connected to 'datalogdb' database");
    db.collection('display', {strict:true}, function(err, collection) {
      if (err) {
        console.log("The 'display' collection doesn't exist. Creating it...");
        populateDB();
      }
    });
  }
});

exports.setDisplay = function(req, res) {
  var data = req.body;
  var dataOk = true;
  console.log('data: ' + JSON.stringify(data));
  console.log('line: ' + req.params.line);
  var line = parseInt(req.params.line);
  data.line = line;
  if (line < 0 || line > 3) {
    res.send("Die Zeile mus im interval 0 bis 3 liegen");
  }
  if (dataOk) {
    console.log('Adding Display: ' + JSON.stringify(data));
    db.collection('display', function(err, collection) {
      collection.remove({line:line}, {}, function(err, result) {
        if (err) {
          res.send({'error':'An error has occurred'});
        } else {
          collection.insert(data, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + result.insertedIds);
                res.send(result.insertedIds);
            }
        });
        }
      });
    });
  }
}

var populateDB = function() {

};

var getData = function(item, callback) {
  unirest.get('http://localhost:3000/rest/newest/' + item.device_id + "/" + item.key + "/")
    .end(function (response) {
      callback(null, {line: item.line, device_id: item.device_id, key: item.key, value: response.body});
    });
}

exports.getDisplay = function(req, res) {
  db.collection('display', function(err, collection) {
    collection.find().sort({line:1}).toArray(function(err, items) {
      async.map(items, getData, function(err, results){
        var displayLines = ["", "", "", ""];
        results.forEach(function(e, i, a) {
          displayLines[e.line] = e.device_id.substring(0,5) + " " + e.value.substring(0,4);
        });
        res.send(displayLines.join('\n'));
      });
    });
  });
};

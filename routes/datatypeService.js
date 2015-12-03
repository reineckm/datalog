var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('datalogdb', server);

db.open(function(err, db) {
  if(!err) {
    console.log("Connected to 'datalogdb' database");
    db.collection('datatypes', {strict:true}, function(err, collection) {
      if (err) {
        console.log("The 'datatypes' collection doesn't exist. Creating it...");
        populateDB();
      }
    });
  }
});

exports.getDatatype = function(req, res) {
    db.collection('datatypes', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.addDatatype = function(req, res) {
  var type = req.body;
  var dataOk = true;
  if (dataOk) {
    console.log('Adding Device: ' + JSON.stringify(type));
    db.collection('datatypes', function(err, collection) {
      collection.insert(type, {safe:true}, function(err, result) {
        if (err) {
          res.send({'error':'An error has occurred'});
        } else {
          console.log('Success: ' + result.insertedIds);
          res.send(result.insertedIds);
        }
      });
    });
  }
}

var populateDB = function() {

};

var client = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {

  console.log("Connected correctly to server");
  // console.log(db);

  var col = db.collection('bandsintown');


// group by artist and date

col.aggregate([
        {
        "$project": { // select fields
            "artists" : 1 ,
            "venue" : 1 ,
            "datetime": 1
        }},
        { $unwind: "$artists" },
        { 
            $group: {
            _id: "$artists.name",
            }
        },{
        $sort: {"_id" : 1}

        }, { $out: "artists_list" }

    ], function (err, result) {
        if (err) { console.log(err); return; }
        console.log(result);
        db.close(); 
    })
});

var client = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {

  console.log("Connected correctly to server");
  // console.log(db);

  var col = db.collection('bandsintown');

// group by day and venue
col.aggregate([
    {
        "$project": { // select fields
            "artists" : 1 ,
            "venue" : 1 ,
            "y" : { "$year": "$datetime" },
            "m" : { "$month": "$datetime" },
            "d" : { "$dayOfMonth": "$datetime" }
        }
    },
    { $unwind: "$artists" } // développer array pour pouvoir en lire les valeurs
    , {
        "$group": { 
            "_id": { // group by day
                "year": "$y",
                "month": "$m",
                "day": "$d",
                "venue_id" : "$venue.id"
            }
            , artists : { $push: "$artists.name"  } // gather artists name
            , count: {
                "$sum": 1 // count the number of artists
            }
        }
    },
    {
        $sort: { // sort by day
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1
        }
    },
    ] , function (err, result) {
        if (err) { console.log(err); return; }
        console.log(result);
        for (var i = 0; i < result.length; i++) {
            if (result[i].count != 1) console.log(result[i]);
        }
        db.close(); 
    })




/*  // // group by date
  col.aggregate([
        { $unwind: "$artists" },
        { 
            $group: {
            _id: { $dayOfYear : "$datetime"},
            // venue : { $min: "$venue"},
            artists : { $push: "$artists.name"  }
            }
        }
    ], function (err, result) {
        if (err) { console.log(err); return; }
        console.log(result);
        db.close(); 
    })*/

/*
// group by day
col.aggregate([
    {
        "$project": { // select fields
            "artists" : 1 ,
            "y" : { "$year": "$datetime" },
            "m" : { "$month": "$datetime" },
            "d" : { "$dayOfMonth": "$datetime" }
        }
    },
    { $unwind: "$artists" } // développer array pour pouvoir en lire les valeurs
    , {
        "$group": { 
            "_id": { // group by day
                "year": "$y",
                "month": "$m",
                "day": "$d"
            }
            , artists : { $push: "$artists.name"  } // gather artists name
            , count: {
                "$sum": 1 // count the number of artists
            }
        }
    },
    {
        $sort: { // sort by day
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1
        }
    }
    ] , function (err, result) {
        if (err) { console.log(err); return; }
        console.log(result);
        db.close(); 
    })

*/
  /*
  // group by venue
  col.aggregate([
        { $unwind: "$artists" },
        { 
            $group: {
            _id: "$venue.id",
            venue : { $min: "$venue"},
            artists : { $push: "$artists.name"  }
            }
        }
    ], function (err, result) {
        if (err) { console.log(err); return; }
        console.log(result);
        db.close(); 
    })
*/

//   col.mapReduce(
//     function  () { 
//         emit( this.venue.id, this.artists ); 
//     },
//     function  (key, values) { 
//          return Array.sum(values); 
//      },
//     {
//         query : {},
//         out : { inline : 1 }
//     },
//     function(err, docs) {
//         console.log(docs);
//         for (var i = 0; i < docs.length; i++) {
//             console.log(typeof(docs[i].value));

//             // for (var j = 0; j < docs[i].value.length; j++) {
//             //     console.log(docs[i].value);
//             // }
//         }
        
//         db.close();
//     }
// )




});


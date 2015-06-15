var client = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {

  console.log("Connected correctly to server");
  // console.log(db);

  var col = db.collection('london_bandsintown');

  col

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


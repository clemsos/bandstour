var client = require('mongodb').MongoClient;
//// NEED THIS IN ORDER TO LET THE INDEX BUILD FOR LARGE VALUES: db.getSiblingDB('admin').runCommand( { setParameter: 1, failIndexKeyTooLong: false } )
// Connection URL
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {

    console.log("Connected correctly to server");
    // console.log(db);

    var gigsCollection = db.collection('bandsintown');
    var gigsCollection2 = db.collection('minedArtists');
        gigsCollection.createIndex({artists : -1});
        gigsCollection.createIndex({artists : 1});
        gigsCollection2.createIndex({meanOfGigsPerYear : 1});
        gigsCollection2.createIndex({meanOfGigsPerYear : -1});
        gigsCollection2.createIndex({co2Spent : 1});
        gigsCollection2.createIndex({co2Spent : -1});
        gigsCollection2.createIndex({totalGigs : 1});
        gigsCollection2.createIndex({totalGigs : -1});
        gigsCollection2.createIndex({meanDelayBetweenGigs : -1});
        gigsCollection2.createIndex({meanDelayBetweenGigs : 1});
        gigsCollection2.createIndex({totalKm: 1});
        gigsCollection2.createIndex({totalKm: -1});


})

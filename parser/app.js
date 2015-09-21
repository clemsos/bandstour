var client = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {

    console.log("Connected correctly to server");
    // console.log(db);

    var gigsCollection = db.collection('bandsintown');
    var selectedGigsCollection = db.collection('selectedGigs');
    var venuesCollection = db.collection('venues');

    storeAllVenues(gigsCollection, "venues" ,function(){
        sampleGigs(5, db, gigsCollection, venuesCollection, function (){
            db.close();
        });
    });

    // getGigsByArtist("Terror", selectedGigsCollection, function(gigs){
    //     console.log(gigs.gigs.length);
    // });

}); // end connection

function sampleGigs(minShowsPerVenue, db, gigsCollection, venuesCollection, callback) {
    var selectedGigsCollection = db.collection('selectedGigs');

    getSelectedVenues(minShowsPerVenue, venuesCollection, function (data) {
        cloneGigsInSelectedVenues(data.selectedVenues, gigsCollection, "selectedGigs", function () {
            storeAllArtists(selectedGigsCollection, "selectedArtists", function () {
                storeAllVenues(selectedGigsCollection, "selectedVenues", function () {
                    callback();
                })
            })
        });
    })
}

function cloneGigsInSelectedVenues(selectedVenues, gigsCollection, newCollName,  callback) {
    // console.log(selectedVenues.length);
    var start = new Date();

    gigsCollection.aggregate([
       { $match: { "venue.id" : { $in : selectedVenues } } }, 
       { $out: newCollName } 
    ], function (err, result) {
        if (err) { console.log(err); return; }
        var end = new Date() - start;
        console.info("Artists execution time: %dms", end);
        gigsCollection.createIndex({artists : 1});
        gigsCollection.createIndex({artists : -1});
        callback(result[0]);
    });
}

function getSelectedVenues(minShows, venuesCollection, callback){
    var start = new Date();

    venuesCollection.aggregate([
             {
                "$project": { // select fields
                    "id" : 1,
                    "count" : 1 
                }
            }
            , { $match : {"count" : { $gte  :  minShows }} }
            , { $group: {
                "_id": "_id"
                , selectedVenues: { $push: "$_id" }
                }
            }
    ], function (err, result) {
        if (err) { console.log(err); return; }

        var end = new Date() - start;
        console.info("Execution time: %dms", end);

        callback(result[0]);
    });
};

function getGigsByArtist(artist, gigsCollection, callback){
    var start = new Date();

    gigsCollection.aggregate([
          {
            "$project": { // select fields
                "artists" : 1,
                "venue" : 1 ,
                "datetime" : 1,
                "y" : { "$year": "$datetime" },
                "m" : { "$month": "$datetime" },
                "d" : { "$dayOfMonth": "$datetime" }
            }
        }
        , { $unwind: "$artists" } // développer array pour pouvoir en lire les valeurs
        , { $match : { "artists.name" : artist} }
        , { $group: {
            "_id": "$artists.name"
            , gigs: { $push: { venue : "$venue", year : "$y", month : "$m", day : "$d", datetime : "$datetime" } }
            }
        }
    ], function (err, result) {
        if (err) { console.log(err); return; }
        
        var end = new Date() - start;
        console.info("GET single artist execution time: %dms", end);
        // console.log(result[0]);
        callback(result[0]);
    });
}

function storeAllVenues (collection, newCollName, callback) {

    var start = new Date();

    collection.aggregate([
        {
            "$project": { // select fields
                "venue" : 1 
            }
        }
        // , { $unwind: "$venue" } // développer array pour pouvoir en lire les valeurs
        ,{ 
            "$group": { 
                "_id":  "$venue.id"  // gather artists name 
                , "city" : { "$first" : "$venue.city"}
                , "name" : { "$first" : "$venue.name"}
                , "url" : { "$first" : "$venue.url"}
                , "country" : { "$first" : "$venue.country"}
                , "region" : { "$first" : "$venue.region"}
                , "longitude" : { "$first" : "$venue.longitude"}
                , "latitude" : { "$first" : "$venue.latitude"}
                // , "id" : { "$first" : "id"}

                , count : { "$sum" :  1 }// count the number of artists
            }
        }
        , { $out : newCollName}
    ] // end pipeline
    , function (err, result) {
        if (err) { console.log(err); return; }
        
        var end = new Date() - start;
        console.info("Venues execution time: %dms", end);

        callback();
    });
}

function storeAllArtists (collection, newCollName, callback) {

    var start = new Date();

    collection.aggregate([
        {
            "$project": { // select fields
                "artists" : 1,
                "venue" : 1,
                "datetime" : 1
                // "y" : { "$year": "$datetime" },
                // "m" : { "$month": "$datetime" },
                // "d" : { "$dayOfMonth": "$datetime" }
            }
        }
        , { $unwind: "$artists" } // développer array pour pouvoir en lire les valeurs
        ,{ 
            "$group": { 
                "_id":  "$artists.name"  // gather artists name 
                , "mbid" : { "$first" : "$artists.mbid"}
                , count : { "$sum" :  1 }// count the number of artists
                , gigs: { 
                    $push: { 
                        venue : "$venue", 
                        datetime : "$datetime"
                        // year : "$y", 
                        // month : "$m", 
                        // day : "$d", 
                    } 
                }

            }
        }
        , { $out : newCollName}
    ] // end pipeline
    ,{allowDiskUse : true}
    , function (err, result) {
        if (err) { console.log(err); return; }
        
        var end = new Date() - start;
        console.info("Artists execution time: %dms", end);

        callback();
    });
}

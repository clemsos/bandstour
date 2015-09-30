var moment = require( 'moment' );
var client = require( 'mongodb' ).MongoClient;
var url = 'mongodb://localhost:27017/bandstour';

var ARTIST_NAME = "David Guetta";
var artistId = slugify(ARTIST_NAME);

// Use connect method to connect to the Server
client.connect( url, function( err, db ) {
    console.log( 'Connected correctly to server\n' );

    var col = db.collection( 'minedArtists' );

    var Nodes = db.collection( 'nodes' );
    var Edges = db.collection( 'edges' );

    // clean everything
    Nodes.drop();
    Edges.drop();

    col.findOne( { "name" : ARTIST_NAME },  function( err, artist ) {
        if(err) throw err;

        // extract all venues
        var venues = artist.gigs
            .map(function (e) {
                return e.venue;
            })
            .reduce( function(map, d , i, context){
                map[d.id] = map[d.id] || d;
                map[d.id].count = ( map[d.id].count || 0 ) + 1;
                return map
            }, {});

        // nodes (venues)
        var nodes = [ ];
        Object.keys( venues ).forEach( function( id ) {
            var venue = venues[ id ];
            var node = makeNode(artistId, venue.id, "venue", venue.latitude, venue.longitude, venue);
            nodes.push(node);
        })

        // calculate edges
        var edges = [];
        for (var i = 0; i < artist.tours.length; i++) {
            var tour = artist.tours[i];
            var tourName = "tour-"+i;
             tour.gigs.forEach(function (gig, j){
                if( j < tour.gigs.length - 1) {
                    // check that source is different from target
                    if(gig.venue.id != tour.gigs[j+1].venue.id) {
                        var edge = makeEdge(artistId, gig.venue.id, tour.gigs[j+1].venue.id, tourName);
                        edges.push( edge);
                    }
                }
             }) 
        }

        console.log(nodes.length, "nodes");
        console.log(edges.length, "edges");

        Nodes.insert(nodes);
        Edges.insert(edges);

        db.close();
    });
})

makeNode = function (networkId, nodeId, group, lat, lng, data, x, y){
    return {
        group: 'nodes',
        data: {
            id: nodeId ||" node-"+ Date.now(),
            lat : lat || 0,
            lng : lng || 0,
            starred : false,
            group : group || "group", // add group
            data : data || {}
        },
        position: {
            x: x || Math.random() *800,
            y: y || Math.random() *600
        },
        networkId : networkId
    }
};

makeEdge = function (networkId, source, target, group, data) {
    return {
        group: 'edges',
        data:  {
          id: 'edge-' + Math.round( Math.random() * 1000000 ),
          'source' :source,
          'target' :target,
          'group' : group || "group",
          data : data
        },
        networkId : networkId
    }
}

function slugify( text ) {
    return text.toString().toLowerCase()
        .replace( /\s+/g, '-' ) // Replace spaces with -
        .replace( /[^\w\-]+/g, '' ) // Remove all non-word chars
        .replace( /\-\-+/g, '-' ) // Replace multiple - with single -
        .replace( /^-+/, '' ) // Trim - from start of text
        .replace( /-+$/, '' ); // Trim - from end of text
}


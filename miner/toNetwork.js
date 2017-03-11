var moment = require('moment');
var client = require('mongodb').MongoClient;
var Bulk = require('mongodb').Bulk;
// console.log(Bulk);
var url = 'mongodb://localhost:27017/bandstour';

var col, Nodes, Edges;

var ARTIST_NAME = "David Guetta";

// Use connect method to connect to the Server
client.connect(url, function(err, db) {
    console.log('Connected correctly to server\n');

    col = db.collection('minedArtists');
    Nodes = db.collection('nodes');
    Edges = db.collection('edges');

    // clean everything
    // Nodes.drop();
    // Edges.drop();


    // find all artists
    col.find({'gigs.400': {$exists: true}}, { // more than 100 gigs
        slug: 1
    }).toArray(function(err, data) {
        if (err) throw err;

        // make a list of all artists names
        var artistList = data.map(function(item) {
            return item.slug;
        });

        // artistList = ["cannibal-corpse"];
        // artistList = ["david-guetta"];
        // artistList = ["foo-fighters"];
        artistList = ["pneu"];

        // Initialize the Ordered Batch
        //SWITCHED TO ORDERED AS UNORDERED DOESN'T ACKNOWLEDGE WRITES!!!
        
        var nodesBatch = Nodes.initializeOrderedBulkOp();
        var edgesBatch = Edges.initializeOrderedBulkOp();

        // artistList = ["david-guetta"];

        console.log(artistList.length, "artists");
        var count = 0;

        // loop through all artists recursively
        for ( var j = artistList.length - 1; j >= 0; j-- ) {
            saveArtist(artistList[j], function (nodes, edges) {
                for (var i = 0; i < nodes.length; i++) {
                    ///add all venues
                    nodesBatch.find({"data.id" : nodes[i].data.id }).upsert().updateOne(nodes[i])
                };
                    ///TODO:add all artist

                    ///TODO: add all artist/venue edges


                    ///add all venue/venue edges
                for (var i = 0; i < edges.length; i++) {
                    edgesBatch.insert(edges[i])
                };
                count++;
                if(count == artistList.length) executeBatch(edgesBatch, nodesBatch)
            })
        }
    });
})

// Execute the operations
executeBatch = function(edgesBatch, nodesBatch) {
    console.log("execute");
    nodesBatch.execute(function(err, result) {
        if(err) throw err;
        console.dir("nodes ok");
        edgesBatch.execute(function(err, result) {
            if(err) throw err;
            console.dir("edges ok");
        })
    });
}

saveArtist = function(slug, callback) {
    col.findOne({
            "slug": slug
        }, function(err, artist) {
            if (err) throw err; 
            // console.log(artist);
            parseArtist(artist, function(nodes, edges){
                callback(nodes, edges)
            });
        });
}

parseArtist = function(artist, callback) {

    // extract all venues
    var venues = artist.gigs
        .map(function(e) {
            return e.venue;
        })
        .reduce(function(map, d, i, context) {
            map[d.id] = map[d.id] ||  d;
            map[d.id].count = (map[d.id].count || 0) + 1;
            return map
        }, {});

    var nodes = [];
    Object.keys(venues).forEach(function(id) {
        var venue = venues[id];
        var node = makeNode(artist.slug, venue.id, "venue", venue.latitude, venue.longitude, venue);
        nodes.push(node);
    })

    // calculate edges
    var edges = [];
    for (var i = 0; i < artist.tours.length; i++) {
        var tour = artist.tours[i];
        var tourName = "tour-" + i;
        for (var j = 0; j < tour.gigs.length - 1; j++) {
            var gig = tour.gigs[j];
            var nextGig = tour.gigs[j + 1];
            // if(gig.venue.id != nextGig.venue.id) {
            var edge = makeEdge(artist.slug, gig.venue.id, nextGig.venue.id, tourName);
            edges.push(edge);
            // }
        }
    };

    console.log(artist.name, nodes.length, "nodes", edges.length, "edges");

    callback(nodes, edges);
}
///TODO: make more general as to import artists as well
makeNode = function(nodeId, group, lat, lng, data, x, y) {
    return {
        group: 'nodes',
        data: {
            //replaced  node name creation because they were concurrently created
            id: String(nodeId) || 'node-' + Date.now()+Math.random()*10000000000000000,
            lat: lat || 0,
            lng: lng || 0,
            starred: false,
            group: group || "group", // add group
            data: data || {}
        },
        position: {
            x: x || Math.random() * 800,
            y: y || Math.random() * 600
        },
        ///is networkID relevant here?
        //networkId: networkId,
        createdAt: Date.now()
    }
};
///OK
makeEdge = function(networkId, source, target, group, data) {
    return {
        group: 'edges',
        data: {
            //replaced  node name creation because they were concurrently created
            id: 'edge-' + Date.now()+Math.random()*10000000000000000,
            'source': source,
            'target': target,
            'group': group || "group",
            data: data
        },
        ///is always the missing term... It has to be a list
        networkId: networkId,
        createdAt: Date.now()
    }
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

Meteor.publish('comments', function() {
    return Comments.find();
});

Meteor.publish('topArtists', function(count, category) {
    console.log(count, category);
    var acceptedTypes = ["totalKm","meanOfGigsPerYear", "totalGigs", "meanDelayBetweenGigs", "co2Spent"]

    // prevent failure
    if(acceptedTypes.indexOf(category) < 0) new Meteor.Error( 500, 'Wrong top index type' ); 

    // build filter
    var filter = { 'sort' : {},  'limit' : parseInt(count)};
    filter["sort"][category] = -1;

    return Artists.find( {}, filter);
});

Meteor.publish('artist', function (artistId) {
    var artists = Artists.find({'slug' : artistId});
    return artists;
});

Meteor.publish('nodes', function (artistId) {
    var nodes = Nodes.find({'networkId' : artistId});
    console.log(nodes.count(), "nodes");
    return nodes;
});

Meteor.publish('edges', function (artistId) {
    var edges = Edges.find({'networkId' : artistId});
    console.log(edges.count(), "edges");
    return edges;
});

Meteor.publish('fetchNetworkNodes', function (artistId) {
    mapnodes2 =[];
    var edges = Edges.find({'networkId' : artistId});
    var fetchNetworkNodes = edges.map(function(e) {
            return { nodeid1 :e.data.source , nodeid2 :e.data.target};
        }).reduce(function(something, nodeids,ctr,context2){

        if (mapnodes2.indexOf(nodeids.nodeid1)<0){mapnodes2.push(nodeids.nodeid1);}       
        if (mapnodes2.indexOf(nodeids.nodeid2)<0){mapnodes2.push(nodeids.nodeid2);}       
         //   console.log("mapnodes2",mapnodes2);

           return  mapnodes2;

        });
        console.log("WE ARE HERE");
        console.log(mapnodes2.length, "nodes");
});

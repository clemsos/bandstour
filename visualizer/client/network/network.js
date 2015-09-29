// single network
Template.network.created = function(){
    this.network = new ReactiveVar();
    this.changeLayout = new ReactiveVar();
};


Template.network.rendered = function () {
    var self = this;
    var artistId = this.data.networkId;
    console.log(this.data);

    // create graph// network.destroy();
    var network  = NetworkGraph.initNetwork("network");
    Template.instance().network.set(network);

    // fetch and parse data
    var artist  = Artists.findOne();
    
    // nodes are venues
    var venues = artist.gigs
        .map(function (e) {
            return e.venue;
        })
        .reduce( function(map, d , i, context){
            map[d.id] = map[d.id] || d;
            map[d.id].count = ( map[d.id].count || 0 ) + 1;
            return map
        }, {});

    var nodes = [ ];
    Object.keys( venues ).forEach( function( id ) {
        venues[ id ].group = venues[ id ].country;
        var node = {
            data : venues[ id ],
            group : "nodes"
        }
        nodes.push(node);
    })

    // calculate edges
    var edges = [];
    for (var i = 0; i < artist.tours.length; i++) {
        var tour = artist.tours[i];
         tour.venues.forEach(function (d, j){
            if( j < tour.venues.length - 1) {
                var edge = {
                    group : "edges", 
                    data : {
                         'source' : d.id, 
                         'target' : tour.venues[j+1].id, 
                         'group' : i 
                    }
                }
                edges.push( edge);
            }
         }) 
    }

    // console.log(edges, nodes);
    console.log("network : ", artistId, nodes .length, "nodes", edges .length, "edges" );

    for (var i = 0; i <edges.length; i++) {
        if(!edges[i].data.source || !edges[i].data.target) console.log(edges[i]);
    }

    if(network)  network.updateNetworkData(nodes,edges);


    // layout function
    var changeLayout  = function (layoutName) {

        // callback
        var savePositions = function () {
            console.log("update position ");
            //   for (var i = 0; i < net.nodes().length; i++) {
            //         var node = net.nodes()[i];
            //         Meteor.call("updateNodePosition", node.id(), node.position())
            //     }
            }

            var layout = network.net.makeLayout({ 
                name: layoutName,
                stop: savePositions // callback on layoutstop
            });

            // console.log(layout);
            layout.run();
        }

        Template.instance().changeLayout.set(changeLayout);
};

Template.network.onDestroyed(function(){
    // this.network.net.destroy();
    // delete(this.network)
    console.log("network destroyed", this.network);
})
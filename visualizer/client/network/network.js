// single network
Template.network.created = function(){
    this.network = new ReactiveVar();
    this.changeLayout = new ReactiveVar();
};


Template.network.rendered = function () {
    var self = this;
    var artistId = this.data.artistId;
    console.log(this.data);

    // create graph// network.destroy();
    var network  = NetworkGraph.initNetwork("network");
    Template.instance().network.set(network);

    // fetch and parse data
    var artist  = Artists.findOne();
    
    // nodes are venues
    var nodes = artist.gigs
        .map(function (e) {
            return e.venue;
        })
        .reduce( function(map, d , i, context){
            map[d.id] = map[d.id] || d;
            map[d.id].count = ( map[d.id].count || 0 ) + 1;
            return map
        }, {});

    // edges are
    for (var i = 0; i < tours.length; i++) {
        var tour = tours[i];
         
    }
    // var edges = artist.tours
    //     .map(function (e) {
    //         return e.venue;
    //     })
    //     .reduce( function(map, d , i, context){
    //         map[d.id] = map[d.id] || d;
    //         map[d.id].count = ( map[d.id].count || 0 ) + 1;
    //         return map
    //     }, {});

    console.log(edges);

    // Tracker.autorun(function(){
    //     var nodes = Nodes.find().fetch();
    //     var edges = Edges.find().fetch();
    //     for (var i = 0; i <edges.length; i++) {
    //         if(!edges[i].data.source || !edges[i].data.target) console.log(edges[i]);
    //     }
    //     console.log("fetch for ",artistId, nodes .length, "nodes", edges .length, "edges" );
    //     // if(network)  network.updateNetworkData(nodes,edges);
    // });

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

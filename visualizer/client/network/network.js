// single network
Template.network.created = function(){
    this.network = new ReactiveVar();
    this.changeLayout = new ReactiveVar();
};

///TODO:SELECT ARTIST THEN SHOW VENUES
Template.network.rendered = function () {
    var self = this;
    var artistId = this.data.networkId;
    console.log(this.data);
    console.log("this.data.networkId",this.data.networkId)
 
    $("#infoBox").css('visibility', 'hidden'); // hide infobox by default

    // create graph// network.destroy();
  
    var network  = NetworkGraph.initNetwork("network");


    // real-time
    Tracker.autorun(function(){
        // fetch and parse data
        var edges = Edges.find().fetch();
        var nodes = Nodes.find().fetch();

        // console.log(edges, nodes);
        console.log("network : ", artistId, nodes .length, "nodes", edges .length, "edges" );

        for (var i = 0; i <edges.length; i++) {
            if(!edges[i].data.source || !edges[i].data.target) console.log(edges[i]);
        }

        if(network)  network.updateNetworkData(nodes,edges);

    });

    Template.instance().network.set(network);

    // layout function
    var changeLayout  = function (layoutName) {

        // callback
        var savePositions = function () {
            console.log("update position ");
            var nodesLayout = network.net.nodes().map(function(node){
                return { id : node.id(), position : node.position()};
            });
            Meteor.call("updateNodesPositions", nodesLayout);
        }

            var layout = network.net.makeLayout({ 
                name: layoutName,
                stop: savePositions // callback on layoutstop
            });
            layout.run();
        }

        Template.instance().changeLayout.set(changeLayout);
};

Template.network.onDestroyed(function(){
    // this.network.net.destroy();

    console.log("network destroyed", this.network);
})

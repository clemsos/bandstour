// single network
Template.network.created = function(){
    var self = this;
    var networkId = this.data.networkId;
    this.network = new ReactiveVar();
    this.changeLayout = new ReactiveVar();
};


Template.network.rendered = function () {
    var self = this;
    var networkId = this.data.networkId;

    // create graph// network.destroy();
    var network  = NetworkGraph.initNetwork(networkId);
    Template.instance().network.set(network);

    // fetch data
    Tracker.autorun(function(){
        var nodes = Nodes.find().fetch();
        var edges = Edges.find().fetch();
        for (var i = 0; i <edges.length; i++) {
            if(!edges[i].data.source || !edges[i].data.target) console.log(edges[i]);
        }
        console.log("fetch for ",networkId, nodes .length, "nodes", edges .length, "edges" );
        if(network)  network.updateNetworkData(nodes,edges);
    });

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
    this.network.net.destroy();
    delete(this.network)
    console.log("network destroyed", this.network);
})

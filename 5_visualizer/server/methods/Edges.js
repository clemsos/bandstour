Meteor.methods({

    addEdge : function (edge) {
        Edges.insert(edge);
    },

    batchInsertEdges: function (edges) {
        console.log(edges.length);
        Edges.batchInsert(edges);
    }, 

    deleteEdge : function(edgeId) {
        var edge = Edges.findOne({ "data.id" : edgeId });
        Edges.remove(edge);
    },

});

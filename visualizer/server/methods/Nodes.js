Meteor.methods({

    addNode: function (node) {
        Nodes.insert(node);
    },

    batchInsertNodes: function (nodes) {
        Nodes.batchInsert(nodes);
    }, 

    deleteNode: function (nodeId) {
        var node = Nodes.findOne({ "data.id" : nodeId });
        Nodes.remove(node);
    },

    //update coords in DB 
    updateNodePosition : function(nodeId, position){
        var node = Nodes.findOne({ "data.id" : nodeId });
        Nodes.update({
            _id: node._id
        }, {
            $set: { position: position }
        });
    },

    lockNode : function(nodeId, position){
        var node = Nodes.findOne({ "data.id" : nodeId });
        var locked = node.locked ? false : true;
        Nodes.update({
            _id: node._id
        }, {
            $set: { "locked": locked, "position" : position }
        });
    },

    starNode : function(nodeId) {
        var node = Nodes.findOne({ "data.id" : nodeId });
        var starred = node.data.starred ? false : true;
        Nodes.update({
            _id: node._id
        }, {
            $set: { "data.starred": starred }
        });
    },

});

makeEdge = function (networkId, source, target, data) {
    return {
        group: 'edges',
        data:  {
          id: 'edge-' + Math.round( Math.random() * 1000000 ),
          'source' :source,
          'target' :target,
          data : data,
          name : ""
        },
        createdAt: new Date(),            // current time
        owner: Meteor.userId(),           // _id of logged in user
        networkId : networkId
    }
}
makeNode = function (networkId, nodeId, x, y, lat, lng, data){
    return {
        group: 'nodes',
        data: {
            id: nodeId ||" node-"+ Date.now(),
            lat : lat || 0,
            lng : lng || 0,
            starred : false,
            group : _.random(0,5), // add group
            data : data || {}
        },
        position: {
            x: x || Math.random() *800,
            y: y || Math.random() *600
        },
        networkId : networkId,
        createdAt: new Date(),            // current time
        owner: Meteor.userId()           // _id of logged in user
    }
};

Template.infobox.helpers({

    // onSuccess: function () {
    //     return function (res, val) {
    //         Meteor.call("updateNameByType", Session.get('currentId'), Session.get('currentType'), val);
    //     }
    // },

     currentSelection: function() {
        var id= Session.get('currentId'),
            type = Session.get('currentType'),
            item = {};

        console.log(id, type);

       // if( type == "node") {
       //      item= Nodes.findOne({"data.id" : id});
       //  } else if (type== "edge"){
       //      item= Edges.findOne({"data.id" : id});
       //  }

        return item;
    }
})

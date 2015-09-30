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

        // console.log(Nodes);
       if( type == "node") {
            item = Nodes.findOne({"data.id" : id});
        } else if (type== "edge"){
            item = Edges.findOne({"data.id" : id});
        }

        console.log(item);
        var cleanData = [];
        
        if (item.data) {
          for (d in item.data.data) {
            cleanData.push(d + " : "+item.data.data[d])
          }
        };

        item.info = cleanData;

        return item;
    }
})

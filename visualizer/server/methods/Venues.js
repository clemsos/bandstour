Meteor.methods({ 
    getVenuesToBeShown : function(callback) {
        return Venues.find().fetch();
    }
});

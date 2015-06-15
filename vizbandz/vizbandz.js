Shows = new Meteor.Collection("london_bandsintown");

if (Meteor.isClient) {

  Meteor.subscribe('shows');

    Template.body.helpers({
      shows: function () {
        return Shows.find({}, {sort: {datetime: -1}});
      }
    });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.publish("shows", function () {
      return Shows.find()
    })

    // code to run on server at startup
  });
}


Meteor.methods({
    getShowByVenue: function () {
      return Shows.aggregate();
    }
})


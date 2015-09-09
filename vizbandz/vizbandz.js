// Gigs = new Mongo.Collection("selectedGigs");
Artists = new Mongo.Collection("selectedArtists");


if (Meteor.isClient) {

  Template.map.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.map.rendered = function() {
      L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

      var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 16, attribution: osmAttrib});   

      var map = L.map('map').setView([51.505, -0.09], 13);
      map.addLayer(osm);
      this.map = map;
  }

  Template.map.events({
    'submit form': function (e, template) {
      
      e.preventDefault()
      

      // / Get value from form element
      var bandName = event.target.bandName.value;

      var self = this;
      console.log(template);
      console.log(self);

      if( !bandName ) return

       var getRandomColor = function() {
          var letters = '0123456789ABCDEF'.split('');
          var color = '#';
          for (var i = 0; i < 6; i++ ) {
              color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
      }

      Meteor.call("getGigsByArtist", bandName, function (err, result) {
        if(err) throw err;

        // for (var i = 0; i < result.gigs.length; i++) {
        //   var venue = result.gigs[i].venue;
        //   if(venue)
        //     L.marker([venue.latitude, venue.longitude]).addTo(template.map)
        // }

        var pointList = result.gigs.map(function(gig){
          return new L.LatLng(gig.venue.latitude, gig.venue.longitude);
        })

        var firstpolyline = new L.Polyline(pointList, {
            color: getRandomColor(),
            weight: 3,
            opacity: 0.5,
            smoothFactor: 1
        });

        firstpolyline.addTo(template.map);
      });

    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });


  Meteor.methods({
    getGigsByArtist : function(artistName) {
       return Artists.findOne({ _id : artistName });
    }

    /*getGigsByArtist :  function(artistName, callback) {
      
      var gigs = Gigs.aggregate([
          {
            "$project": { // select fields
                "artists" : 1,
                "venue" : 1 ,
                "datetime" : 1,
                "y" : { "$year": "$datetime" },
                "m" : { "$month": "$datetime" },
                "d" : { "$dayOfMonth": "$datetime" }
            }
        }
        , { $unwind: "$artists" } // développer array pour pouvoir en lire les valeurs
        , { $match : { "artists.name" : artistName} }
        , { $group: {
            "_id": "$artists.name"
            , "gigs": { $push: { venue : "$venue", year : "$y", month : "$m", day : "$d", datetime : "$datetime" } }
            }
        }
        , { $sort: { // sort by day
              "gigs.year": 1,
              "gigs.month": 1,
              "gigs.day": 1
              }
        }
      ]);

      return gigs[0];
  }*/
  });
}

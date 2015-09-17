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

        // var url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var url = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png';
        var attrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        var layer = new L.TileLayer(url, {minZoom: 1, maxZoom: 16, attribution: attrib});

        var map = L.map('map').setView([51.505, -0.09], 13);
        map.addLayer(layer);

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

            if( !bandName ) return;

            var getRandomColor = function() {
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++ ) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }

            function getKmFromLatLong(lat1,lon1,lat2,lon2){
                var R = 6371; // Radius of the earth in km
                var dLat = (lat2 - lat1) * Math.PI / 180;   // deg2rad below
                var dLon = (lon2 - lon1) * Math.PI / 180;
                var a = 
                    0.5 - Math.cos(dLat)/2 + 
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    (1 - Math.cos(dLon))/2;

                return R * 2 * Math.asin(Math.sqrt(a));
            }
                

            Meteor.call("getGigsByArtist", bandName, function (err, result) {
                if(err) throw err;

                // for (var i = 0; i < result.gigs.length; i++) {
                //   var venue = result.gigs[i].venue;
                //   if(venue)
                //       L.marker([venue.latitude, venue.longitude]).addTo(template.map)
                // }
                var km = 0;
                var pointList = result.gigs.map(function(gig, i){
                    var nextGig = result.gigs[i+1]; 
                    if (i < result.gigs.length-1) km += getKmFromLatLong(gig.venue.latitude, gig.venue.longitude, nextGig.venue.latitude,nextGig.venue.longitude );
                    console.log(km);
                    return new L.LatLng(gig.venue.latitude, gig.venue.longitude);
                });

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

        /*getGigsByArtist : function(artistName, callback) {
            
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
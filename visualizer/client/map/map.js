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
var getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

Template.map.events({

    showVenues : function() {
        var salle =[];
        Meteor.call("getVenuesToBeShown", function (err, salle){
            if(err) throw err;
            console.log("salle loop",salle.length);
            for (var i = 0; i < salle.length; i++) {
                var point = salle[i];
               // console.log(point);
                if (point.count > 5) {
                    var circle = L.circle( [point.latitude, point.longitude], point.count, {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.5
                        }).addTo(map).bindPopup(point.name);
                        }
                    };
                })
        },
    showTour : function() {

        var pointList = result.gigs.map(function(gig, i){
            var nextGig = result.gigs[i+1]; 
            return new L.LatLng(gig.venue.latitude, gig.venue.longitude);
        });

        var firstpolyline = new L.Polyline(pointList, {
            color: getRandomColor(),
            weight: 10,
            opacity: 0.5,
            smoothFactor: 1
        });

        firstpolyline.addTo(template.map);

    }


})

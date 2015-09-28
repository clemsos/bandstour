Template.map.rendered = function() {

    // session vars
    Session.set('minShowsPerVenue', 1);

    //  parse data
    var artist  = Artists.findOne();
    var venues = artist.gigs
        .map(function (e) {
            return e.venue;
        })
        .reduce( function(map, d , i, context){
            map[d.id] = map[d.id] || d;
            map[d.id].count = ( map[d.id].count || 0 ) + 1;
            return map
        }, {});

    // console.log(venues);

    // GeoJSON features 
    var features = [];
    Object.keys(venues).forEach(function(id){
        var venue = venues[id];

        if( !isValidCoordinate(venue.latitude) && !isValidCoordinate(venue.longitude) ) 
            console.log(venue, id);

        if( venue.count > Session.get("minShowsPerVenue")) {
            // parse GeoJSON  point
            var p = turf.point(
                               [venue.latitude, venue.longitude],
                               { 'name' : venue.name , 'count' : venue.count, 'city' : venue.city, 'country' : venue.country } 
                    );
            features.push(p);
        }
    })


    // GeoJSON collection
    var collection = turf.featurecollection(features);
    // console.log(collection);

    // setup map
    L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';
    var url = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png';
    var attrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var layer = new L.TileLayer(url, {minZoom: 1, maxZoom: 16, attribution: attrib});
    var map = L.map('map').setView([51.505, -0.09], 6);
    map.addLayer(layer);

    // setup d3 SVG
    var svg = d3.select(map.getPanes().overlayPane).append("svg")
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

    // radius scale 
    var radius = d3.scale.linear()
            .domain([0,20])
            .range([5, 50]);

    var feature = g.selectAll("circle")
        .data(collection.features).enter()
        .append("circle")
        .attr("fill", "red")
        .attr("r", function(d){ return 25 }) //radius(d.properties.count) })
        .style("stroke", "black")  
        .style("opacity", .6)

    feature.on('click', function(d){
        console.log(d.properties.name,d.properties.city, d.properties.country);
    })

    // define projection
    map.on("viewreset", update);
    map.on("zoom", update);
    update();

    function update() {
        var bounds = path.bounds(collection),
        // var bounds = boundingExtent(features),
        // var bounds = map.getBounds();
            topLeft = bounds[0],
            bottomRight = bounds[1];

        console.log(bounds);

        // console.log(topLeft, bottomRight);

        // Setting the size and location of the overall SVG container
        svg .attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        // points
        feature.attr("transform",  function(d) { 
            return "translate("+ 
                 applyLatLngToLayer(d).x + ","+ 
                applyLatLngToLayer(d ).y +")";
        })

    }

    function boundingExtent(features) {
      var boundExtent = [[0,0],[0,0]];
      for (var x in features) {
        thisBounds = d3.geo.bounds(features[x]);
        boundExtent[0][0] = Math.min(thisBounds[0][0],boundExtent[0][0]);
        boundExtent[0][1] = Math.min(thisBounds[0][1],boundExtent[0][1]);
        boundExtent[1][0] = Math.max(thisBounds[1][0],boundExtent[1][0]);
        boundExtent[1][1] = Math.max(thisBounds[1][1],boundExtent[1][1]);
      }
      return boundExtent;
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

    function applyLatLngToLayer(d) {
        var y = d.geometry.coordinates[1]
        var x = d.geometry.coordinates[0]
        return map.latLngToLayerPoint(new L.LatLng(x, y))
    }

    function isValidCoordinate(lat) {
        var val = parseFloat(lat);
        return (!isNaN(val) && val <= 90 && val >= -90)? true :  false;
    }
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

    'click #showVenues' : function(e) {
        e.preventDefault();
        var artist  = Artists.findOne();

        var venues = artist.gigs
            .map(function  (d) {
                return d.venue;
            })
            .reduce(function(map, d){
                map[d.id] = map[d.id] || d;
                map[d.id].count = ( map[d.id].count || 0 ) + 1;
                return map
            });

        Object.keys(venues).forEach(function(id){
            var venue = venues[id];
            if( venue.count > Session.get("minShowsPerVenue")) {
                
                // var circle = L.circle( [venue.latitude, venue.longitude], venue.count, {
                //     color: 'red',
                //     fillColor: '#f03',
                //     fillOpacity: 0.5
                //     })
                // .addTo(map)
                // .bindPopup(venue.name);
            }
        })
    },

    'click showTours' : function(e) {
        e.preventDefault();
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

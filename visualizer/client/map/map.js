Template.map.rendered = function() {
    // session vars
    Session.set('minShowsPerVenue', 0);

    var maxRadius = 25;
    //  parse data
    var artist = Artists.findOne();
    var venues = artist.gigs
        .map(function(e) {
            return e.venue;
        })
        .reduce(function(map, d, i, context) {
            map[d.id] = map[d.id] ||  d;
            map[d.id].count = (map[d.id].count || 0) + 1;
            return map
        }, {});

    // GeoJSON features 
    var features = [];
    ///init gravitycenter calculation
    var bandgravitylat = [];
    var bandgravitylong = [];
    Object.keys(venues).forEach(function(id) {
        var venue = venues[id];

        if (!isValidCoordinate(venue.latitude, venue.longitude)) {
            console.log(venue, id);
            return;
        }

        if (venue.count > Session.get("minShowsPerVenue")) {
            // parse GeoJSON  point
            var p = turf.point(
                [venue.latitude, venue.longitude], {
                    'name': venue.name,
                    'count': venue.count,
                    'city': venue.city,
                    'country': venue.country
                }
            );
            features.push(p);
            ///add coords for gravitycentercalculation
            bandgravitylat.push(venue.latitude);
            bandgravitylong.push(venue.longitude);
        }
    });
    var bandgravitycenterlat = 0;
    var bandgravitycenterlong = 0;
    for (var i = 0; i < bandgravitylat.length; i++) {
        bandgravitycenterlat += bandgravitylat[i];
        bandgravitycenterlong += bandgravitylong[i];
    };
    console.log("bandgravitycenterlat", bandgravitycenterlat);
    bandgravitycenterlat = bandgravitycenterlat / bandgravitylat.length
    console.log("bandgravitycenterlat", bandgravitycenterlat);
    bandgravitycenterlong = bandgravitycenterlong / bandgravitylong.length

    console.log("centralité géo", bandgravitycenterlat, bandgravitycenterlong);
    var q = [];
    q.push(turf.point(
        [bandgravitycenterlat, bandgravitycenterlong], {
            'name': artist.name,
            'city': "centre de gravité",
            'country': (bandgravitycenterlat+" et "+ bandgravitycenterlong),
            'info' : 'centre de gravité'
        }
    ));

    console.log("q", q);

    // GeoJSON collection
    var collection = turf.featurecollection(features);
    console.log("collection", collection);
    var colleccentr = turf.featurecollection(q);
    console.log("colleccentr", colleccentr);
    // console.log(collection);

    // setup map
    L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';
    var url = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png';
    var attrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var layer = new L.TileLayer(url, {
        minZoom: 2,
        maxZoom: 16,
        attribution: attrib
    });
    var map = L.map('map').setView([51.505, -0.09], 6);
    map.addLayer(layer);

    // setup d3 SVG
    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var transform = d3.geo.transform({
            point: projectPoint
        }),
        path = d3.geo.path().projection(transform);

    // radius scale 
    var radius = d3.scale.linear()
        .domain([
            Session.get('minShowsPerVenue'),
            d3.max(Object.keys(venues).map(function(d) {
                return venues[d].count;
            }))
        ])
        .range([5, maxRadius]);

    var feature = g.selectAll("circle")
        .data(collection.features).enter()
        .append("circle")
        .attr("r", function(d) {
            return radius(d.properties.count);
        })
        .style("fill", "red")
        .style("stroke", "none")
        .style("opacity", .6);
    //features du centre de G géo FIX ME!! CHANGE STYLE OF THE CENTRALITY POINT
    console.log("g",g)
    var featurecentr = g.selectAll("circle")
        .data(colleccentr.features).enter()
        .append("circle")
        .attr("r", 500)
        .style("fill", "green")
        .style("stroke", "none")
        .style("opacity", .8);
    console.log("featurecentr", featurecentr);
    feature.on('click', function(d) {
        console.log(d.properties.name, d.properties.city, d.properties.country);
    });

    // define projection
    map.on("viewreset", update);
    map.on("zoom", update);
    update();

    function update() {
        var bounds = path.bounds(collection),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        console.log(bounds);

        // console.log(topLeft, bottomRight);

        // Setting the size and location of the overall SVG container
        svg.attr("width", bottomRight[0] - topLeft[0] + maxRadius)
            .attr("height", bottomRight[1] - topLeft[1] + maxRadius)
            .style("left", (topLeft[0] - maxRadius / 2) + "px")
            .style("top", (topLeft[1] - maxRadius / 2) + "px");
        // .attr( "viewbox", )

        g.attr("transform", "translate(" + (-topLeft[0]) + "," + (-topLeft[1]) + ")");

        // points
        feature.attr("transform", function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
        });
        //point du centre de G géo
        featurecentr.attr("transform", function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
        });
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(x, y));
        this.stream.point(point.x, point.y);
    }

    function applyLatLngToLayer(d) {
        var y = d.geometry.coordinates[1];
        var x = d.geometry.coordinates[0];
        return map.latLngToLayerPoint(new L.LatLng(x, y))
    }

    function isValidCoordinate(lat, lng) {
        var valLat = parseFloat(lat);
        var valLng = parseFloat(lng);
        return (!isNaN(valLat) && valLat <= 90 && valLat >= -90 && !isNaN(valLng) && valLng <= 180 && valLng >= -180) ? true : false;
    }
}

var getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

Template.map.events({
    'click #showVenues': function(e) {
        e.preventDefault();
        var artist = Artists.findOne();
        // render 
    },

    'click showTours': function(e) {
        e.preventDefault();
        var pointList = result.gigs.map(function(gig, i) {
            var nextGig = result.gigs[i + 1];
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
});

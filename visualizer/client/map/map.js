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
      return map;
    }, {});

  /*console.log(artist.gigs)
  console.log(venues)
*/
  // GeoJSON features
  var features = [];


  ///init gravitycenter calculation
  var bandgravitylat = [];
  var bandgravitylong = [];
  Object.keys(venues).forEach(function(id) {
    var venue = venues[id];
    if (!isValidCoordinate(venue.latitude, venue.longitude)) {
      /*console.log(venue, id);*/
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
      for (var c = 0; c < venue.count; c++) {
        bandgravitylat.push(venue.latitude);
        bandgravitylong.push(venue.longitude);
      }
    }
  });

  // GeoJSON collection
  var collection = turf.featurecollection(features);
  // console.log( "collection", collection );

  var bandgravitycenterlat = 0,
    bandgravitycenterlong = 0;
  for (var i = 0; i < bandgravitylat.length; i++) {
    bandgravitycenterlat += bandgravitylat[i];
    bandgravitycenterlong += bandgravitylong[i];
  };
  // console.log("bandgravitycenterlat", bandgravitycenterlat);
  bandgravitycenterlat = bandgravitycenterlat / bandgravitylat.length;
  // console.log("bandgravitycenterlat", bandgravitycenterlat);
  bandgravitycenterlong = bandgravitycenterlong / bandgravitylong.length;

  // console.log("centralité géo", bandgravitycenterlat, bandgravitycenterlong);
  var q = [];

  q.push(turf.point(
    [bandgravitycenterlat, bandgravitycenterlong], {
      'name': artist.name,
      'location': (bandgravitycenterlat + " " + bandgravitycenterlong),
      'info': 'centre de gravité'
    }
  ));

  // console.log("q", q);

  // GeoJSON collection
  var collection = turf.featurecollection(features);
  // console.log("collection", collection);
  var colleccentr = turf.featurecollection(q);
  // console.log("colleccentr", colleccentr);

  /*-----GeoJSON features for Edges-----------*/
  var r = [];

  edges = [];
/*  console.log(artist);*/
var colorsTours = d3.scale.category20c();

  Object.keys(artist.tours).forEach(function(ic) {
  var hhh = 0;
    Object.keys(artist.tours[ic].gigs).forEach(function(id) {

/*      console.log(artist.tours[ic].gigs[id]);
      console.log(artist.tours[ic].gigs[id - 1]);*/
      if (hhh == 0) {
        hhh = hhh + 1;
        console.log("THERE////////////////");
      } else {
        /*  console.log("h", h)
          console.log("artist.tours[ic].gigs[id].datetime", artist.tours[ic].gigs[id].datetime)*/
        //USELESS IF HEREBUT HEy... KEpT FOR BACKU
        /*if ((typeof yieldTimeScaleStart == 'undefined') || (yieldTimeScaleStart <= artist.tours[ic].gigs[id].datetime && yieldTimeScaleEnd >= artist.tours[ic].gigs[id].datetime))
        {*/
        var coordsEdge = {
          id: id,
          datetime: artist.tours[ic].gigs[id - 1].datetime,
          colorTour: colorsTours(ic),
          tour: ic,
          sourcelat: artist.tours[ic].gigs[id - 1].venue.latitude,
          sourcelong: artist.tours[ic].gigs[id - 1].venue.longitude,
          sourcename: artist.tours[ic].gigs[id - 1].venue.name,
          sourcecity: artist.tours[ic].gigs[id - 1].venue.city,
          sourceid: artist.tours[ic].gigs[id - 1].venue.id,

          targetlat: artist.tours[ic].gigs[id].venue.latitude,
          targetlong: artist.tours[ic].gigs[id].venue.longitude,
          targetname: artist.tours[ic].gigs[id].venue.name,
          targetcity: artist.tours[ic].gigs[id].venue.city,
          targetid: artist.tours[ic].gigs[id].venue.id,
        };
        /*        console.log("coordsEdge",coordsEdge)
         */


        edges.push(coordsEdge);
        /*}*/

        /*  console.log("edges",edges)
          console.log("edges",coordsEdge)*/

        if (hhh == 0 || hhh >= artist.tours[ic].gigs.length || (!isValidCoordinate(coordsEdge.sourcelat, coordsEdge.sourcelong)) && (!isValidCoordinate(coordsEdge.targetlat, coordsEdge.targetlong))) {
          hhh = hhh + 1;
          return;
        } else {
          // parse GeoJSON  point
          var p = turf.linestring(
            [
              [coordsEdge.sourcelat, coordsEdge.sourcelong],
              [coordsEdge.targetlat, coordsEdge.targetlong]
            ], {

              'id': coordsEdge.id,
              'datetime': coordsEdge.datetime,
              'colorTour':coordsEdge.colorTour,
              'tour':coordsEdge.tour,
              'sourcelat': coordsEdge.sourcelat,
              'sourcelong': coordsEdge.sourcelong,
              'sourcename': coordsEdge.sourcename,
              'sourcecity': coordsEdge.sourcecity,
              'sourceid': coordsEdge.sourceid,

              'targetlat': coordsEdge.targetlat,
              'targetlong': coordsEdge.targetlong,
              'targetname': coordsEdge.targetname,
              'targetcity': coordsEdge.targetcity,
              'targetid': coordsEdge.targetid,


            }

          r.push(p);
          //console.log("q1",q);
          ///add coords for gravitycentercalculation

        }
      }

    });
  });


  // GeoJSON collection for Edges
  // console.log( "q2", q );
  var collectionedges = turf.featurecollection(r);


console.log("collectionedges",collectionedges);


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

  var svg = d3.select("#map").append("svg")
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0)
    .style("width", d3.select("body").style('width'))
    .style("height", d3.select("#map").style('height'));

  var g = svg.append("g").attr("class", "leaflet-zoom-hide");
  /*Session.set('SVGMAP', g);*/
  var transform = d3.geo.transform({
      point: projectPoint
    }),
    path = d3.geo.path().projection(transform);
  var popup = L.popup();

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
      return Math.pow(radius(d.properties.count),4/5);
    })
    .style("fill", "red")
    .style("stroke", "none")
    .style("opacity", .6);

  // features du centre de Gravité géographique FIX ME!! CHANGE STYLE OF THE CENTRALITY POINT
  var g2 = svg.append("g").attr("class", "leaflet-zoom-hide");
  var featurecentr = g2.selectAll("circle")
    .data(colleccentr.features).enter()
    .append("circle")
    .attr("r", 10)
    .style("fill", "green")
    .style("stroke", "none")
    .style("opacity", .8);




  // features des edges
/*  var gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#3cd")
    .attr("stop-opacity", 1);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#533")
    .attr("stop-opacity", 1);*/

  /*    var marker = svg.append("defs")
        .append("marker")
          .attr("id", "arrow")
          .attr("markerWidth", "10")
          .attr("markerHeight", "10")
          .attr("refx", "0")
          .attr("refy", "3")
          .attr("orient", "auto")
          .attr("markerUnits", "strokeWidth");

      marker.append("path")
          .attr("d", "m5,5 L0,6 L9,3 z")
          .attr("fill", "#0c0")
*/


  var g3 = svg.append("g").attr("class", "leaflet-zoom-hide");

  var featureedges = g3.selectAll('line')
    .data(collectionedges.features).enter()
    .append('line')
    //  .style('stroke', 'yellow')
    .style('stroke', function(d) {
      return d.properties.colorTour;
    })

    /*      .style('marker-end',"url(#arrow)")*/
    .style('stroke-width', '2')
    /*.style('opacity', .8);*/
    //TODO:IMPORT TIME TO NEXT GIG SELECT IF SAME OR DIFFERENT TOUR BY COMPARING IF UNDER 10 DAYS , IF NOT SAME IF SO: DIFFERENT
     console.log( "featureedges", featureedges );

//POPUP MECANISM But we need a switch for choosing between the 2
  d3.selectAll("circle").on('mouseover', function(d) {
       var infos = "";
       for (var p in d.properties) {
         infos += p + ": " + d.properties[p] + "\n";
       }
/*     console.log("d",d)*/
       popup
           .setLatLng(d.geometry.coordinates)
           .setContent(infos)
           .openOn(map);
console.log(d.geometry.coordinates);
       console.log(infos);
     });

  d3.selectAll('line').on('mouseover', function(d) {
    var infos = '';
    // linestring
    for (var p in d.properties) {
      infos += p + ': ' + d.properties[p] + '\n';
    }
    map.on('click', function(e) {
      popup
          .setLatLng(e.latlng)
          .setContent(infos)
          .openOn(map);
    });



    console.log(infos);
    // console.log( infos );
  });


  ///SELECTOR FOR THE EDGES
  if (!initialRead || initialRead == 0) {
    var initialRead = "1";
    Session.set('TimeStart', new Date(Session.get('min')));
    Session.set('TimeEnd', new Date(Session.get('max')));
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  }

  var TimeStart = Session.get('TimeStart');
  var TimeEnd = Session.get('TimeEnd');


  Edgesetup = function() {
    g3.selectAll("line").attr("opacity", function(d) {
      /*        console.log("d", d);*/

      if (typeof d.properties.datetime == 'undefined') {
        console.log("dERROR", d)
        return;

      } else {
        /*console.log("d.properties.datetime",d.properties.datetime);
        console.log("TimeStart",TimeStart);
        console.log("TimeEnd",TimeEnd);
        console.log("d.properties.datetime >= TimeStart && d.properties.datetime <= TimeEnd",d.properties.datetime >= TimeStart && d.properties.datetime <= TimeEnd);*/
        return (d.properties.datetime >= Session.get('TimeStart') && d.properties.datetime <= Session.get('TimeEnd')) ? 1 : 0
      }
    });
  }

  Edgesetup();
  // define projection


  function resetView() {
    svg.style("width", d3.select("body").style('width'))
      .style("height", d3.select("#map").style('height'));
    update();
  }

  update = function() {
    var mapBounds = map.getBounds();
    var SW = map.latLngToLayerPoint(mapBounds._southWest),
      NE = map.latLngToLayerPoint(mapBounds._northEast);
    // console.log(NE, SW);
    // console.log(Math.abs(NE.x - SW.x), Math.abs(NE.y - SW.y));
    /*  console.log(this);
     */
    svg.attr("viewBox", SW.x + " " + NE.y + " " + Math.abs(NE.x - SW.x) + " " + Math.abs(NE.y - SW.y));

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
    /*    console.log(featureedges);
     */
    featureedges.attr('x1', function(d) {

        return applyLatLngToLayerForEdges(map, d.geometry.coordinates[0]).x;
      })
      .attr('y1', function(d) {
        return applyLatLngToLayerForEdges(map, d.geometry.coordinates[0]).y;
      })
      .attr('x2', function(d) {
        return applyLatLngToLayerForEdges(map, d.geometry.coordinates[1]).x;
      })
      .attr('y2', function(d) {
        return applyLatLngToLayerForEdges(map, d.geometry.coordinates[1]).y;
      });
  }

  map.on("resize", resetView);
  map.on("move", update);
  map.on("zoom", update);
  update();
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



Template.map.onRendered(function() {
  Deps.autorun(function() {


    var sess1 = Session.get('slider')[0];
    /*var sess2 = Session.get('slider')[1];*/
    Session.set('TimeStart', new Date(Session.get('slider')[0]));
    Session.set('TimeEnd', new Date(Session.get('slider')[1]));

    Edgesetup();

  })
})

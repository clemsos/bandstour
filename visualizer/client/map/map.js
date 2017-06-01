


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
          );

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

//http://leafletjs.com/examples/layers-control/

//HERE STARTS THE MAP BACKGROUND LIST
  var OpenStreetMap_Mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  	maxZoom: 19,
  	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  var OpenTopoMap = L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  	maxZoom: 17,
  	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  var Stamen_Toner = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

var Stamen_TonerLite = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
var Esri_WorldTerrain = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
	maxZoom: 13
});

var NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});



var CartoDB_PositronNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
});


//END OF MAPS BACKGROUND

////HERE ARE OVERLAYS




// https: also suppported.
var Stamen_TonerLines = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.{ext}', {
attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
subdomains: 'abcd',
minZoom: 0,
maxZoom: 20,
ext: 'png'
});
// https: also suppported.
var Stamen_TonerLabels = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.{ext}', {
attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
subdomains: 'abcd',
minZoom: 0,
maxZoom: 20,
ext: 'png'
});
var OpenWeatherMap_Wind = L.tileLayer('http://{s}.tile.openweathermap.org/map/wind/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
opacity: 0.5
});
// https: also suppported.
var NASAGIBS_ModisTerraSnowCover = L.tileLayer('http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Snow_Cover/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
minZoom: 1,
maxZoom: 8,
format: 'png',
time: '',
tilematrixset: 'GoogleMapsCompatible_Level',
opacity: 0.75
});
// https: also suppported.
var NASAGIBS_ModisTerraAOD = L.tileLayer('http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Aerosol/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
minZoom: 1,
maxZoom: 6,
format: 'png',
time: '',
tilematrixset: 'GoogleMapsCompatible_Level',
opacity: 0.75
});
// https: also suppported.
var NASAGIBS_ModisTerraChlorophyll = L.tileLayer('http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Chlorophyll_A/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
minZoom: 1,
maxZoom: 7,
format: 'png',
time: '',
tilematrixset: 'GoogleMapsCompatible_Level',
opacity: 0.75
});
var JusticeMap_income = L.tileLayer('http://www.justicemap.org/tile/{size}/income/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_americanIndian = L.tileLayer('http://www.justicemap.org/tile/{size}/indian/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_asian = L.tileLayer('http://www.justicemap.org/tile/{size}/asian/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_black = L.tileLayer('http://www.justicemap.org/tile/{size}/black/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_hispanic = L.tileLayer('http://www.justicemap.org/tile/{size}/hispanic/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_multi = L.tileLayer('http://www.justicemap.org/tile/{size}/multi/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_nonWhite = L.tileLayer('http://www.justicemap.org/tile/{size}/nonwhite/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_white = L.tileLayer('http://www.justicemap.org/tile/{size}/white/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});
var JusticeMap_plurality = L.tileLayer('http://www.justicemap.org/tile/{size}/plural/{z}/{x}/{y}.png', {
attribution: '<a href="http://www.justicemap.org/terms.php">Justice Map</a>',
size: 'county',
bounds: [[14, -180], [72, -56]]
});







////END OF OVERLAYS









  //var url = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png';
  //var attrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
  //var layer = new L.TileLayer(url, {
//    minZoom: 2,
//    maxZoom: 16,
//    attribution: attrib
//  });
  var baseMaps = {
  "OpenStreetMap_Mapnik" : OpenStreetMap_Mapnik,
  "OpenTopoMap" : OpenTopoMap,
  "Stamen_Toner" : Stamen_Toner,
  "Stamen_TonerLite" : Stamen_TonerLite,
  "Esri_WorldImagery" : Esri_WorldImagery,
  "Esri_WorldTerrain" : Esri_WorldTerrain,
  "NASAGIBS_ViirsEarthAtNight2012"   : NASAGIBS_ViirsEarthAtNight2012,
  "CartoDB_PositronNoLabels": CartoDB_PositronNoLabels
  };

var maplayers ={
  "Stamen_TonerLines": Stamen_TonerLines,
  "Stamen_TonerLabels": Stamen_TonerLabels,
  "OpenWeatherMap_Wind": OpenWeatherMap_Wind,
  "NASAGIBS_ModisTerraSnowCover": NASAGIBS_ModisTerraSnowCover,
  "NASAGIBS_ModisTerraAOD": NASAGIBS_ModisTerraAOD,
  "NASAGIBS_ModisTerraChlorophyll": NASAGIBS_ModisTerraChlorophyll,
  "JusticeMap_income": JusticeMap_income,
  "JusticeMap_americanIndian": JusticeMap_americanIndian,
  "JusticeMap_asian": JusticeMap_asian,
  "JusticeMap_black": JusticeMap_black,
  "JusticeMap_hispanic": JusticeMap_hispanic,
  "JusticeMap_multi": JusticeMap_multi,
  "JusticeMap_nonWhite": JusticeMap_nonWhite,
  "JusticeMap_white": JusticeMap_white,
  "JusticeMap_plurality": JusticeMap_plurality

}



  var map = L.map('map', {
      center: [51.505, -0.09],
      zoom: 6,
      layers: [CartoDB_PositronNoLabels, Stamen_TonerLines,Stamen_TonerLabels ]
  });

  //var map = L.map('map').setView([51.505, -0.09], 6);
  L.control.scale().addTo(map);
L.control.layers(baseMaps, maplayers).addTo(map);

//  map.addLayer(layer);

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

  var popup = L.popup({'className' : 'leaflet-control leaflet-control-container leaflet-bar'});

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

     //
    //  //POPUP MECANISM
///NEW POPUP/TOOLLTIP USING D3 FOR SOLVING THE Z INDEX ISSUE
       var div = d3.select("body").append("div")
           .attr("class", "tooltip")
           .style("opacity", 0);
d3.selectAll('circle').on('mouseover', function(d) {
  var infos = "";
  console.log(d.properties.name);
  for (var p in d.properties) {
    infos += p + ": " + d.properties[p] + "<br/> ";

  }
  infos +=' <a href=https://wwww.google.fr/search?q='+ slugifyForGoogle(d.properties.name)+ ' target="_blank"> find '+d.properties.name+' on google</a>'
console.log(infos);

  div
  //.transition()
      //.duration(200)
      .style("opacity", .9);
  div .html(infos)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px")
      .on('click', function(dd){
      //   //TRYING ANOTHER QWAY FOR THE LINK
       var win = window.open("https://google.fr/search?q="+slugifyForGoogle(d.properties.name), '_blank');
       })
  })

  d3.selectAll('line').on('click', function(d) {
    var infos = "";
    for (var p in d.properties) {
      infos += p + ": " + d.properties[p] + "<br/> ";
    }
    div.transition()
        .duration(200)
        .style("opacity", .9);
    div .html(infos)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })





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


function slugifyForGoogle( text ) {
    return text.toString( ).toLowerCase( )
        .replace( /\s+/g, '\+' ) // Replace spaces with +
        .replace( /\+\++/g, '\+' ) // Replace multiple + with single +
        .replace( /^\++/, '' ) // Trim + from start of text
        .replace( /\++$/, '' ); // Trim + from end of text
}



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
  // //NOT WORKING WAY TO OPEN LINKS
  // 'click a[target=_blank]' : function(e){
  //     var artist = Artists.findOne();
  //     console.log("I AM CLICKED IT IS REAL");
  //     var win = window.open("https://google.fr/search?q="+slugifyForGoogle(), '_blank');
  //   //win.focus();
 // }

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

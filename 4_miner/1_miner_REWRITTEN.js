var _ = require('agile');
var moment = require( 'moment' );
var client = require( 'mongodb' ).MongoClient;
var math = require('mathjs');
var url = 'mongodb://localhost:27017/bandstour?socketTimeoutMS=900000000000';


// Use connect method to connect to the Server
client.connect( url, function( err, db ) {
    console.log( 'Connected correctly to server\n' );

    // db
    var col = db.collection( 'selectedArtists' ),
        newcol = db.collection( 'minedArtists' );

    // clean everything
    //newcol.drop();

    // const
    var    MAX_DELTA_BETWEEN_DATES = 10, //Days
        MIN_DELTA_BETWEEN_DATES = 3, // HOURS
        MINIMUM_DATES = 5; //For considering an artist as touring

    // init
    var artistList = [];
    console.log(artistList);
    col.find( {}, { _id: 1 } ).toArray( function( err, data ) {
        if ( err ) throw err;

        //  console.log("DD",data);

        artistList = data.map( function( item ) {
            return item._id;
        } );
        //console.log(artistList);
        //artistList = ["Stick to Your Guns"]
        //artistList =["DJ Stingray"]
        //artistList = ["Stickup Kid"]
        artistList =["Sticky Fingers"]

        for ( var j = artistList.length - 1; j >= 0; j-- ) {


          col.findOne( {
              _id: artistList[ j ]  }, function( err, artist ) {
              if ( err ) throw err;
              if ( artist.gigs.length <= MINIMUM_DATES ) return; // check minimum dates
              artist.gigs = _.orderBy(artist.gigs, 'datetime' )
//console.log(artist.gigs);

/*INIT THIS ARTIST*/
var totalKm = 0; //distance totale parcourue
var timeOnTour = 0;
var timeOffTour = 0;
var km=0;
var tourInProgress=0;
var lastDate = 0;
var tours = [];
var tour = {};
tour.gigs = [];

var singleGigs = [];
var toursCoords = {};
var idTour =0;
var tourCoords =[];
var dupl=0


for ( var i = 0; i <= artist.gigs.length - 2; i++ ) { // exclude i=0 and last elt
          var nextGig = artist.gigs[ i + 1 ];
          var gig = artist.gigs[ i ];






var gigBTdate = betweenDatesOrDup(gig, nextGig);

if ( i == (artist.gigs.length - 2) ) { lastDate = 1}
else
{ lastDate = 0}
console.log("gig",gig.datetime);
console.log("nextGig",nextGig.datetime);
console.log("lastDate",lastDate);
console.log("gigBTdate",gigBTdate);

if (gigBTdate == -1) {
dupl+=1
console.log("DUPDUPDUP");

} else if (gigBTdate == 1) {
  console.log("HERE WE TOUR");
  if ( !tourInProgress && lastDate == 0 ) {
    console.log("HERE WE TOUR BUT NO TOUR IN PROGRESS");
      tour = {};
      tour.gigs = [];
      tourCoords =[];

  } else if (!tourInProgress && lastDate == 1) {
    singleGigs.push(gig)
    singleGigs.push(nextGig)

  }
  console.log("tourprog=0,LD=1",tour);
  tour.gigs.push( gig );
  tourInProgress = true;
  timeOnTour += gig.timeToNextGig;
  tourCoords.push([gig.venue.latitude,gig.venue.longitude])

} else {
  console.log("HERE WE ARE ");

                          // more than 2 days to next date
                          if ( !tourInProgress ) { // single gig
                              singleGigs.push( gig );
                              tourInProgress = false;
                          } else { // last gig of the tour
                              // distance must be calculated before adding last gig
                              // since last gig.distanceToNextGig should not be part of function () {

                              }
                              tour.distance = 0;
                              for ( var g in tour.gigs ) {
                                  tour.distance += tour.gigs[ g ].distanceToNextGig;
                              } // total distance

                              tour.gigs.push( gig );
                              tourCoords.push([gig.venue.latitude,gig.venue.longitude])
                              tour.nbGigs = tour.gigs.length; // number of gigs
                              tourInProgress = false;
                              console.log("<<<<<<<<TOUR>>>>>>>>>>>",tour)
                              tours.push( tour );
                          }

                          // off tour
                          timeOffTour += gig.timeToNextGig;
if (lastDate == 1 && tourInProgress && gigBTdate == 0) { // end the tour
  console.log("ended in tour");
  console.log("tour",tour);
    tour.distance = 0;
    for ( var d in tour.distances ) {
        tour.distance += tour.distances[ d ];
    } // total distance
    //tour.gigs.push( gig );
    console.log("LD==1&TOUR==1 & gigBT==0");
    tour.gigs.push( nextGig );
    tour.nbGigs = tour.gigs.length; // number of gigs
    tourCoords.push([nextGig.venue.latitude,nextGig.venue.longitude])
    tourInProgress = false;

    tours.push( tour );
} else  if (lastDate == 1 && !tourInProgress  && gigBTdate == 0){ // single date
  console.log("ended out of tour");
  console.log("tour",tour);

    //singleGigs.push(gig)
    singleGigs.push( nextGig );
console.log("singlegigs\n",singleGigs);
    tourInProgress = false;
}



}





};
// catch errors
var nbDatesOnTour = 0;
for ( var n = 0; n < tours.length; n++ ) {
    nbDatesOnTour += tours[ n ].gigs.length;
}// fin de for var i
if ( nbDatesOnTour + singleGigs.length  + dupl != artist.gigs.length ) {
    console.log( '!! ERROR >>>> nbDatesOnTour+dupl+singleGigs.length != artist.gigs.length:', nbDatesOnTour, '+',dupl,'+', singleGigs.length, '!=', artist.gigs.length );
    console.log("tours",tours);
    console.log("singleGigs",singleGigs);
    //throw "Wrong number of dates";
} else {
  console.log( 'GOT IT RIGHT! >>>> nbDatesOnTour+dupl+singleGigs.length == artist.gigs.length:', nbDatesOnTour, '+',dupl,'+', singleGigs.length, '!=', artist.gigs.length );
}


})//fin du findOne
}///fin de     for ( var j = artistList.length - 1; j >= 0; j-- ) {
})//fin du find
})//fin du connect


  function getKmFromLatLong( lat1, lon1, lat2, lon2 ) {
      var R = 6371; // Radius of the earth in km
      var dLat = ( lat2 - lat1 ) * Math.PI / 180; // deg2rad below
      var dLon = ( lon2 - lon1 ) * Math.PI / 180;
      var a =
          0.5 - Math.cos( dLat ) / 2 +
          Math.cos( lat1 * Math.PI / 180 ) * Math.cos( lat2 * Math.PI / 180 ) *
          ( 1 - Math.cos( dLon ) ) / 2;

      return R * 2 * Math.asin( Math.sqrt( a ) );
  }





  function slugify( text ) {
      return text.toString().toLowerCase()
          .replace( /\s+/g, '-' ) // Replace spaces with -
          .replace( /[^\w\-]+/g, '' ) // Remove all non-word chars
          .replace( /\-\-+/g, '-' ) // Replace multiple - with single -
          .replace( /^-+/, '' ) // Trim - from start of text
          .replace( /-+$/, '' ); // Trim - from end of text
  }


function betweenDatesOrDup(date1,date2) {

  var MAX_DELTA_BETWEEN_DATES = 10, //Days
  MIN_DELTA_BETWEEN_DATES = 3, // HOURS
  MINIMUM_DATES = 5;

  // Calcul des temps entres gigs et du temps total de tournées
  date1.timeToNextGig = moment( date2.datetime ).diff( moment( date1.datetime ) );

  // Detect tours : check number of days between 2 gigs
  // NEW:ALSO CHECK THAT THE DATES ARE NOT TOO CLOSE ( 3H MEANING A DUPLICATE)
  testme=moment.duration( date1.timeToNextGig ).asHours()

  //SI LA DATE EST ENTRE NOS DEUX BORNES
if ( testme <= MAX_DELTA_BETWEEN_DATES*24  && testme > MIN_DELTA_BETWEEN_DATES){
  return 1
}
else if (testme < MIN_DELTA_BETWEEN_DATES) {
  return -1

}
else if (testme > MAX_DELTA_BETWEEN_DATES*24) {
  return 0
}
else {
  console.log("ERROR CONDITION TEST");
}
}
//fin de betweenDates

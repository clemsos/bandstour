var _ = require('agile');
var moment = require( 'moment' );
var client = require( 'mongodb' ).MongoClient;
var url = 'mongodb://localhost:27017/bandstour?socketTimeoutMS=900000000000';


// Use connect method to connect to the Server
client.connect( url, function( err, db ) {
    console.log( 'Connected correctly to server\n' );

    // db
    var col = db.collection( 'selectedArtists' ),
        newcol = db.collection( 'minedArtists' );

    // clean everything
    newcol.drop();

    // const
    var DELTA_BETWEEN_DATES = 10,
        PLANE_DISTANCE = 1500,
        MINIMUM_DATES = 5;

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

        for ( var j = artistList.length - 1; j >= 0; j-- ) {


            col.findOne( {
                _id: artistList[ j ]
            }, function( err, artist ) {
                if ( err ) throw err;
                if ( artist.gigs.length <= MINIMUM_DATES ) return; // check minimum dates
                artist.gigs = _.orderBy(artist.gigs, 'datetime' )

                var totalKm = 0; //distance totale parcourue
                var timeOnTour = 0;
                var timeOffTour = 0;

                var tours = [];
                var tour = {};
                tour.gigs = [];

                var singleGigs = [];
                var toursCoords = {};
                var idTour =0;
                var tourCoords =[];
                var tourInProgress = false;

                for ( var i = 0; i <= artist.gigs.length - 2; i++ ) { // exclude i=0 and last elt
                    var nextGig = artist.gigs[ i + 1 ];
                    var gig = artist.gigs[ i ];

                    // Calcul des distances entres gigs et de la distance totale parcourue
                    var km = getKmFromLatLong( gig.venue.latitude, gig.venue.longitude, nextGig.venue.latitude, nextGig.venue.longitude );
                    totalKm += km;
                    gig.distanceToNextGig = km;

                    // Calcul des temps entres gigs et du temps total de tournées
                    gig.timeToNextGig = moment( nextGig.datetime ).diff( moment( gig.datetime ) );

                    // Detect tours : check number of days between 2 gigs
                    if ( moment.duration( gig.timeToNextGig ).asDays() <= DELTA_BETWEEN_DATES ) { // on tour
                        if ( !tourInProgress ) {
                            tour = {};
                            tour.gigs = [];
                            tourCoords =[];
                        }

                        tour.gigs.push( gig );
                        tourInProgress = true;
                        timeOnTour += gig.timeToNextGig;
                        tourCoords.push([gig.venue.latitude,gig.venue.longitude])

                    } else {

                        // more than 2 days to next date
                        if ( !tourInProgress ) { // single gig
                            singleGigs.push( gig );
                            tourInProgress = false;
                        } else { // last gig of the tour
                            // distance must be calculated before adding last gig
                            // since last gig.distanceToNextGig should not be part of tour.distance
                            tour.distance = 0;
                            for ( var g in tour.gigs ) {
                                tour.distance += tour.gigs[ g ].distanceToNextGig;
                            } // total distance

                            tour.gigs.push( gig );
                            tourCoords.push([gig.venue.latitude,gig.venue.longitude])
                            tour.nbGigs = tour.gigs.length; // number of gigs
                            tourInProgress = false;

                            tours.push( tour );
                        }

                        // off tour
                        timeOffTour += gig.timeToNextGig;
                    }

                    // parse last date
                    if ( i == artist.gigs.length - 2 ) {
                        if ( tourInProgress ) { // end the tour
                            tour.distance = 0;
                            for ( var d in tour.distances ) {
                                tour.distance += tour.distances[ d ];
                            } // total distance

                            tour.gigs.push( nextGig );
                            tour.nbGigs = tour.gigs.length; // number of gigs
                            tourCoords.push([nextGig.venue.latitude,nextGig.venue.longitude])
                            tourInProgress = false;

                            tours.push( tour );
                        } else { // single date
                            singleGigs.push( nextGig );
                            tourInProgress = false;
                        }
                    }
                }

                // catch errors
                var nbDatesOnTour = 0;
                for ( var n = 0; n < tours.length; n++ ) {
                    nbDatesOnTour += tours[ n ].gigs.length;
                }
                if ( nbDatesOnTour + singleGigs.length != artist.gigs.length ) {
                    console.log( '!! ERROR >>>> nbDatesOnTour+singleGigs.length != artist.gigs.length:', nbDatesOnTour, '+', singleGigs.length, '!=', artist.gigs.length );
                    throw "Wrong number of dates";
                };

                // calcul du nombre moyen de dates / tour
                var meanTourLength = nbDatesOnTour / tours.length;

                //ecart type
                var sqEcarts = [];
                var sumSqEcarts = 0;
                for ( var t = 0; t < tours.length; t++ ) {
                    var sqEcart = Math.pow( tours[ t ].gigs.length - meanTourLength, 2 );
                    sqEcarts.push( sqEcart );
                    sumSqEcarts += sqEcart;
                }
                var ecartType = Math.sqrt( sumSqEcarts / sqEcarts.length );

                // calculate total time
                var sortedGigs = artist.gigs.map( function( item, k ) {
                    return item.datetime;
                } );
                var totalTime = moment( sortedGigs[ sortedGigs.length - 1 ] ).diff( moment( sortedGigs[ 0 ] ) );

                //TOUR DUTY CYCLE
                var tourDutyCycle = timeOnTour / totalTime;
                // console.log('tourDutyCycle = timeOnTour / totalTime:', tourDutyCycle * 100, '%' );

                // calcul du nombre moyen de dates / année
                var meanOfGigsPerYear = artist.gigs.length / moment.duration( totalTime ).asYears();
                // console.log('meanOfGigsByYear:', meanOfGigsPerYear);

                // calcul du délais moyen entre 2 concerts
                var meanDelayBetweenGigs = moment.duration( totalTime ).asDays() / artist.gigs.length
                // console.log('meanDelayBetweenGigs:', meanDelayBetweenGigs, "days");

                //source: http://www.sightline.org/research/graphics/climate-co2bymode/
                var co2Spent = totalKm / 3;
                // console.log('co2 depense par membre du groupe (en kg) /premiere approx:', co2Spent);

                // store values
                artist.name = artist._id;
                artist.slug = slugify( artist._id );
                delete( artist._id ); // remove id to allow auto mongo id
                artist.tours = tours;
                artist.singleGigs = singleGigs;
                artist.totalKm = totalKm;
                artist.totalGigs = nbDatesOnTour + singleGigs.length;
                artist.ecartType = ecartType;
                artist.tourDutyCycle = tourDutyCycle;
                artist.meanOfGigsPerYear = meanOfGigsPerYear;
                artist.meanDelayBetweenGigs = meanDelayBetweenGigs;
                artist.co2Spent = co2Spent;

                console.log( artist.name, co2Spent );
                newcol.insert( artist );
            } );
        };
    } );
    console.log("ddddd",artistList);
    // db.close();
} );

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

function clone( obj ) {
    if ( null == obj || 'object' != typeof obj ) return obj;
    var copy = obj.constructor();
    for ( var attr in obj ) {
        if ( obj.hasOwnProperty( attr ) ) copy[ attr ] = obj[ attr ];
    }
    return copy;
}

function slugify( text ) {
    return text.toString().toLowerCase()
        .replace( /\s+/g, '-' ) // Replace spaces with -
        .replace( /[^\w\-]+/g, '' ) // Remove all non-word chars
        .replace( /\-\-+/g, '-' ) // Replace multiple - with single -
        .replace( /^-+/, '' ) // Trim - from start of text
        .replace( /-+$/, '' ); // Trim - from end of text
}

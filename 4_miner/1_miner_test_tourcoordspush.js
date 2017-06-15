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
    var MAX_DELTA_BETWEEN_DATES = 10, //Days
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
        artistList = ["Stick to Your Guns"]

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
                 var condUnAnte = 0
                var tours = [];
                var tour = {};
                dupl=0
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
                    // NEW:ALSO CHECK THAT THE DATES ARE NOT TOO CLOSE ( 3H MEANING A DUPLICATE)
                    testme=moment.duration( gig.timeToNextGig ).asHours()

                    //SI LA DATE EST ENTRE NOS DEUX BORNES
                  if ( testme <= MAX_DELTA_BETWEEN_DATES*24  && testme > MIN_DELTA_BETWEEN_DATES){
                    console.log("COND ZERO");
                    console.log("OTHER TIME", math.abs(artist.gigs[i+1].datetime - artist.gigs[i].datetime));
                    console.log("testme",testme)
                    console.log("testme",testme*3600)
                    console.log("testme",testme );
                    console.log("MAX_DELTA_BETWEEN_DATES", MAX_DELTA_BETWEEN_DATES);
                    console.log("MIN_DELTA_BETWEEN_DATES",MIN_DELTA_BETWEEN_DATES);
                    //SI LA DATE EST ENTRE NOS DEUX BORNES: ON RESET LE FAIT QUE LA DATE D AVANT ETAIT PERRAVE
                    condUnAnte = 0

                    //SI ON EST PAS SUR UNE TOURNEE, ON EN CREE UNE,
                        if ( !tourInProgress ) {
                            tour = {};

                            tour.gigs = [];
                            tourCoords =[];
                        }
                        dupl=0
                        tour.gigs.push( gig );
                        tourInProgress = true;
                        timeOnTour += gig.timeToNextGig;
                        //console.log((gig.venue.latitude));
                        console.log("gigLat",parseFloat(gig.venue.latitude));
                        console.log("nextgigLat",parseFloat(nextGig.venue.latitude));
                        klat = gig.venue.latitude
                        //console.log(klat);
                        console.log(math.round(parseFloat(gig.venue.latitude),3));

                        tourCoords.push([math.round(parseFloat(gig.venue.latitude),3),math.round(parseFloat(gig.venue.longitude),3)])

                    } else if (testme > MAX_DELTA_BETWEEN_DATES*24  && testme > MIN_DELTA_BETWEEN_DATES) {
                      console.log("COND UN");
                      console.log("OTHER TIME", testme);
                      console.log("testme",testme)
                      console.log("testme",testme*3600)
                      console.log("testme",testme );
                      console.log("MAX_DELTA_BETWEEN_DATES", MAX_DELTA_BETWEEN_DATES*24);
                      console.log("MIN_DELTA_BETWEEN_DATES",MIN_DELTA_BETWEEN_DATES);

                        // more than 2 days to next date
                        if ( !tourInProgress || condUnAnte == 1  ) { // single gig
                            singleGigs.push( gig );
                            tourInProgress = false;

                            //condUnAnte = 1
                            console.log("PUSHE UNE");
                        } else { // last gig of the tour
                            // distance must be calculated before adding last gig
                            // since last gig.distanceToNextGig should not be part of tour.distance

                            tour.distance = 0;
                            for ( var g in tour.gigs ) {
                                tour.distance += tour.gigs[ g ].distanceToNextGig;
                            } // total distance

                            tour.gigs.push( gig );
                            tourCoords.push[math.round(parseFloat(gig.venue.latitude),4),math.round(parseFloat(gig.venue.longitude),3)]
                            tour.nbGigs = tour.gigs.length; // number of gigs
                            tourInProgress = false;
                            //console.log("tourCoords",tourCoords);
                            toursCoords[idTour]=(tourCoords)
                            idTour +=1
                            console.log("toursCoords",toursCoords);
                            console.log("dupl",dupl);
                            tours.push( tour );
                        }

                        // off tour
                        timeOffTour += gig.timeToNextGig;
                    }else if (testme <= MIN_DELTA_BETWEEN_DATES) {
                      dupl +=1
                      console.log("COND DEUX");
                      console.log("OTHER TIME", math.abs(artist.gigs[i+1].datetime - artist.gigs[i].datetime));
                      console.log("testme",testme)
                      console.log("testme",testme*3600)
                      console.log("testme",testme );
                      console.log("MAX_DELTA_BETWEEN_DATES", MAX_DELTA_BETWEEN_DATES);
                      console.log("MIN_DELTA_BETWEEN_DATES",MIN_DELTA_BETWEEN_DATES);
                      condUnAnte == 0
                      console.log(">>>>>>>>>>>>>>dupl HERE>>>>>>>>>>>>>");


                    } else {
                      console.log("COND TROIS");
                      console.log("OTHER TIME", math.abs(artist.gigs[i+1].datetime - artist.gigs[i].datetime));
                      console.log("testme",testme)
                      console.log("testme",testme*3600)
                      console.log("testme",testme );
                      console.log("MAX_DELTA_BETWEEN_DATES", MAX_DELTA_BETWEEN_DATES);
                      console.log("MIN_DELTA_BETWEEN_DATES",MIN_DELTA_BETWEEN_DATES);


                    }

                    // parse last date
                    if ( i == artist.gigs.length - 2 ) {
                        if ( tourInProgress ) { // end the tour
                            tour.distance = 0;
                            condUnAnte == 0
                            for ( var d in tour.distances ) {

                                tour.distance += tour.distances[ d ];
                            } // total distance
                            //console.log("artist.gigs[i]",artist.gigs[i-1]);
                            //console.log("artist.gigs[i]",artist.gigs[i]);




                            tour.gigs.push( nextGig );
                            tour.nbGigs = tour.gigs.length; // number of gigs
                            tourCoords.push[math.round(parseFloat(nextGig.venue.latitude),3),math.round(parseFloat(nextGig.venue.longitude),3)]
                            tourInProgress = false;
                            toursCoords[idTour]=(tourCoords)
                            idTour +=1
                            //console.log("tourCoords",tourCoords);
                            console.log("toursCoords",toursCoords);
                            console.log("dupl",dupl);
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
                if ( nbDatesOnTour + singleGigs.length  + dupl != artist.gigs.length ) {
                    console.log( '!! ERROR >>>> nbDatesOnTour+singleGigs.length != artist.gigs.length:', nbDatesOnTour, '+', singleGigs.length, '!=', artist.gigs.length );
                    throw "Wrong number of dates";
                };
                dupl = 0;
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
                //newcol.insert( artist );
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

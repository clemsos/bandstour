var moment = require('moment');
var client = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {
    console.log('Connected correctly to server\n\n\n');
    // console.log(db);

    var col = db.collection('selectedArtists');
        newcol = db.collection('minedArtists');
        deltaEntreDates = 10;
        distanceavion = 1500;
        artistList = [];

    col.find({}, {_id:1}).toArray(function(err, data){
        if(err) throw err;
        // console.log(data);
        artistList = data.map(function(item){ return item._id; });
        //console.log(artistList);
    
        for (var j = artistList.length - 1; j >= 0; j--){
            col.findOne({ _id : artistList[j] }, function(err,artist){  
                if(err) throw err;

                if (artist.gigs.length <= 2) return;

                console.log('//////////////////////////////////////////');
                console.log('artist._id:',artist._id);
                console.log('artist.gigs.length:',artist.gigs.length);

                var totalKm = 0; //distance totale parcourue
                var timeOnTour = 0;
                var timeOffTour = 0;
                for(var i = 0; i <= artist.gigs.length - 2; i++){
                    var nextGig = artist.gigs[i+1];
                    
                    // Calcul des distances entres gigs et de la distance totale parcourue
                    // FAIT DANS LES LOOPS DE DATES
                    //var km = getKmFromLatLong(artist.gigs[i].venue.latitude, artist.gigs[i].venue.longitude, nextGig.venue.latitude,nextGig.venue.longitude ) ;
                    //totalKm += km; 
                    //artist.gigs[i].distanceToNextGig = km;           

                    // Calcul des temps entres gigs et du temps total de tournées
                    var timeToNextGig = moment(nextGig.datetime).diff(moment(artist.gigs[i].datetime));
                    artist.gigs[i].timeToNextGig = timeToNextGig;
                    
                    //Detection de tournées
                    if(moment.duration(timeToNextGig).asDays() <= deltaEntreDates ){// 10 jours au plus entre deux dates et on considère que ce n'est plus une même tournée.
                        artist.gigs[i].tourInProgress = 1;
                        artist.gigs[i+1].tourInProgress = 1;
                        timeOnTour += artist.gigs[i].timeToNextGig;
                    }
                    else  {
                        if(artist.gigs[i].tourInProgress){
                            artist.gigs[i].tourInProgress = 1;
                            artist.gigs[i].tourLastDate = true;
                        }
                        else{
                            artist.gigs[i].tourInProgress = 0;
                        }
                        
                        if( i == artist.gigs.length - 2) artist.gigs[i+1].tourInProgress = 0;

                        timeOffTour += artist.gigs[i].timeToNextGig;
                    }
                    // console.log('['+i+']:\t', artist.gigs[i].tourInProgress,Math.floor( moment.duration(timeToNextGig).asDays()), '\t', artist.gigs[i].datetime, artist.gigs[i].tourLastDate || '');
                }

                // Comptage du nombre de tournees et de leurs durees
                var tournees = [];                
                var tournee = {};
                tournee.dates = [];
                tournee.distances = [];
                tournee.venues =[];
                tournee.distance = 0;
                var datesUniques = [];
                datesUniques.dates = [];
                datesUniques.distances = [];
                datesUniques.venues = [];
                for (var i = 0; i <= artist.gigs.length - 1; i++) {
                    var km = null;
                    if (i == 0 || i >= artist.gigs.length) {}
                    else { km = getKmFromLatLong(artist.gigs[i-1].venue.latitude, artist.gigs[i-1].venue.longitude, artist.gigs[i].venue.latitude, artist.gigs[i].venue.longitude ) ;}
                    if (artist.gigs[i].tourInProgress == 0){ //date unique
                        //stocke la date
                        datesUniques.dates.push(artist.gigs[i].datetime);
                        //stocke la distance parcourue la prochaine date
                        datesUniques.distances.push(km);
                        //stocke les salles
                        datesUniques.venues.push(artist.gigs[i].venue);
                        totalKm += km; 
                    }
                    else if (artist.gigs[i].tourInProgress == 1){//en tournée
                        tournee.dates.push(artist.gigs[i].datetime);
                        tournee.distances.push(km);
                        tournee.venues.push(artist.gigs[i].venue);
                        totalKm += km;
                        if( artist.gigs[i].tourLastDate || i == artist.gigs.length -1 ){
                            tournee.nbDates = tournee.dates.length;
                            for (var k = tournee.distances.length  ; k >=     0; k--) {
                              if (tournee.distances[k] != null) {tournee.distance += tournee.distances[k]}
                                else {};
                                                   };
                            tournees.push( clone(tournee) );

                            tournee = {};
                            tournee.dates = [];
                            tournee.distance = 0;
                            tournee.distances = [];
                            tournee.venues = [];


                        }
                    }
                }

                var nbDatesOnTour = 0;
                for(var n=0;n<tournees.length; n++){
                    nbDatesOnTour += tournees[n].nbDates;
                }
                if(nbDatesOnTour+datesUniques.length != artist.gigs.length){
                    console.log(
                        '>>>> nbDatesOnTour+datesUniques.length != artist.gigs.length:',
                        nbDatesOnTour,
                        '+',
                        datesUniques.length,
                        '!=',
                        artist.gigs.length
                    );
                }


                console.log('nbDatesUniques:', datesUniques.length);
                console.log('datesUniques:', datesUniques);

                console.log('nbDatesOnTour:', nbDatesOnTour);
                console.log('nbTournees:', tournees.length);
                console.log('tournees:',tournees);

                var sortedGigs = artist.gigs.map(function(item, k){ return item.datetime; });
                var totalTime = moment(sortedGigs[sortedGigs.length-1]).diff(moment(sortedGigs[0]));
                console.log(
                    'totalTime:',
                    moment.duration(totalTime).asDays(),'jours',
                    '||',
                    moment.duration(totalTime).asYears(),'years'
                );
                console.log('timeOnTour:',moment.duration(timeOnTour).asDays(),'jours');
                console.log('timeOffTour:',moment.duration(timeOffTour).asDays(),'jours');
                if(totalTime != timeOnTour + timeOffTour){
                    console.log(
                        '>>>> timeOnTour + timeOffTour != totalTime',
                        timeOnTour,
                        '+',
                        timeOffTour,
                        '!=',
                        totalTime
                    );
                }

                // calcul du nombre moyen de dates / tournee
                var meanTourLength = nbDatesOnTour / tournees.length;
                console.log('meanTourLength: '+ meanTourLength);
                
                //ecart type
                var sqEcarts = [];
                var sumSqEcarts = 0;
                for(var t=0; t<tournees.length; t++){
                    var sqEcart = Math.pow(tournees[t].dates.length - meanTourLength, 2);
                    sqEcarts.push(sqEcart);
                    sumSqEcarts += sqEcart;
                }

                var ecartType = Math.sqrt(sumSqEcarts/sqEcarts.length);
                console.log('ecartType:', ecartType);

                //TOUR DUTY CYCLE
                var tourDutyCycle = timeOnTour / totalTime;
                console.log('tourDutyCycle = timeOnTour / totalTime:', tourDutyCycle * 100, '%' );

                // calcul du nombre moyen de dates / année
                var meanOfGigsPerYear = artist.gigs.length / moment.duration(totalTime).asYears();
                console.log('meanOfGigsByYear:', meanOfGigsPerYear);

                // calcul du délais moyen entre 2 concerts
                console.log('meanDelayBetweenGigs:', moment.duration(totalTime).asDays()/ artist.gigs.length, "days");

                console.log('totalKm: '+ totalKm);
                var co2Spent = totalKm / 3 ;
                console.log('co2 depense par membre du groupe (en kg) /premiere approx:', co2Spent);
                //source: http://www.sightline.org/research/graphics/climate-co2bymode/

                // newcol.insert({_id : artistList [j], gigs : updatedGigs });
                console.log('\n\n');
            });
        };
    console.log("////TRAITEMENT FINI - HOURRAH!////")
    });
    //db.close();
    
});

function getKmFromLatLong(lat1,lon1,lat2,lon2){
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = 
        0.5 - Math.cos(dLat)/2 + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        (1 - Math.cos(dLon))/2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

function clone(obj) {
    if (null == obj || 'object' != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}




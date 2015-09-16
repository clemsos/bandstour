var moment = require('moment');
var client = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/bandstour';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {
    console.log("Connected correctly to server");
    // console.log(db);

    var col = db.collection('selectedArtists'),
        newcol = db.collection('minedArtists'),
        deltaEntreDates = 10,
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
                //console.log(artistList[j]);
                var totalConcerts = artist.gigs.length; //nombre total de concerts
                var totalKm = 0; //distance totale parcourue 
                var updatedGigs = artist.gigs.map(function(gig, i){
                    if (i < artist.gigs.length-2) {
                        var nextGig = artist.gigs[i+1];
                      
                        // Calcul des distances entres gigs et de la distance totale parcourue
                        var km = getKmFromLatLong(gig.venue.latitude, gig.venue.longitude, nextGig.venue.latitude,nextGig.venue.longitude ) ;
                        totalKm += km; 
                        gig.distanceToNextGig = km;           
                    
                        // Calcul des temps entres gigs et du temps total de tournées
                         gig.timeToNextGig = moment(nextGig.datetime).diff(moment(gig.datetime));
                        
                        //   console.log(totalKm,moment.duration(timeToNextGig).asDays())
                    }
                 
                    return gig;  
                });

                //Duree de la collection de dates de l'artiste
                var sortedGigs = artist.gigs.map(function(item, k){ return item.datetime; })
        
                var timeTotour = moment(sortedGigs[sortedGigs.length-1]).diff(moment(sortedGigs[0]));
                console.log("frequences de tournee")
                console.log(sortedGigs.length);
                console.log(moment.duration(timeTotour).asYears());
                var frequencyOfTheGigs = (sortedGigs.length)/moment.duration(timeTotour).asYears();
                console.log("frequencyOfTheGigs",frequencyOfTheGigs);
                //Calcul de la durée moyenne entre concerts
                
                console.log("amount of gigs", artist.gigs.length); 
                   
                //BOUCLE DE COMPTAGE DES DATES
                var sumTotalDatatime = 0;
                var sumToursTimeON = 0;
                var sumToursTimeOFF = 0;
                var tourDutyCycle = 0;
                for (var m = 0; m <= artist.gigs.length - 1; m++) {
                    // console.log("temps d'ici la prochaine date",moment.duration(artist.gigs[m].timeToNextGig).asDays());
                    
                    artist.gigs[m].tourInProgress = 0;
                    sumTotalDatatime += parseFloat(moment.duration(artist.gigs[m].timeToNextGig).asDays()) ; 
                    var meanTimeTonextGig = parseFloat((sumTotalDatatime)/(artist.gigs.length));
                    
                    //Detection de tournées
                    if (moment.duration(artist.gigs[m].timeToNextGig).asDays() <= deltaEntreDates )// 10 jours  au plus entre deux dates et on considère que ce n'est plus une même tournée.
                    { 
                        if( m <= artist.gigs.length -2 ){ 
                            if (moment.duration(artist.gigs[m+1].timeToNextGig).asDays() <= deltaEntreDates ) {
                                sumToursTimeON += parseFloat(moment.duration(artist.gigs[m].timeToNextGig).asDays());
                                artist.gigs[m].tourInProgress = 1; 
                            }   
                        }
                    }
                    else  {
                        sumToursTimeOFF += parseFloat(moment.duration(artist.gigs[m].timeToNextGig).asDays()); 
                        artist.gigs[m].tourInProgress = 0;
                    }
                }

                console.log("sumTotalDatatime",sumTotalDatatime,"jours");
                console.log("sumToursTimeON",sumToursTimeON,"jours");
                console.log("sumToursTimeOFF",sumToursTimeOFF,"jours");

                //TOUR DUTY CYCLE
                console.log("ratio", sumToursTimeON / sumTotalDatatime * 100, "%" )
                console.log("meanTimeTonextGig",meanTimeTonextGig, "jours");
                //console.log("meanTimeTonextGig",moment.duration(meanTimeTonextGig).asDays());

                // Comptage du nombre de tournees et de leurs durees
                var tourCount = 0;
                var tourLength = [];
                var tourDates = [];
                var p = 0;
                var meanTourLength = 0;
                tourLength[0]=0;
                for (var m = 0; m <= artist.gigs.length - 2; m++) {
                    var tournee = {};
                    tournee.dates =[];

                    if (artist.gigs[m].tourInProgress == 0 && artist.gigs[m+1].tourInProgress == 0){} //date unique
                    else if(artist.gigs[m].tourInProgress == 0 && artist.gigs[m+1].tourInProgress == 1) {//début de tournée
                        tourCount += 1;
                        tourLength[p] = 1;
                        console.log(artist.gigs[m+1].datetime);
                        tournee.dates.push (artist.gigs[m+1].datetime) ;
                    }
                    else if (artist.gigs[m].tourInProgress == 1 && artist.gigs[m+1].tourInProgress == 1){//en tournée
                        tourLength[p] += 1;
                        tournee.dates.push(artist.gigs[m+1].datetime) ;
                    }
                    else if (artist.gigs[m].tourInProgress == 1 && artist.gigs[m+1].tourInProgress == 0){//fin de tournée
                        tourLength[p] += 1;
                        tourDates[tourCount].push(tournee);
                        console.log("tournee",tournee);
                        console.log("tourCount",tourCount);
                        console.log("tourDates",tourDates);

                        console.log("détecté une tournée de", tourLength[p],"dates");
                        p +=1;
                    }
                    else throw "Y a un bug";
                }
                // newcol.insert({_id : artistList [j], gigs : updatedGigs });
            });
        };
    });
    // db.close();
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
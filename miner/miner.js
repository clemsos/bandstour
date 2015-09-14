var moment = require('moment');
var client = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/bandsintown';

// Use connect method to connect to the Server
client.connect(url, function(err, db) {

  console.log("Connected correctly to server");
  // console.log(db);

  var col = db.collection('selectedArtists');
  var newcol = db.collection('minedArtists')

    var artistList = [];
    col.find({}, {_id:1}).toArray(function(err, data){
        if(err) throw err;
        // console.log(data);
        artistList = data.map(function(item){ return item._id; })
        //console.log(artistList);
    
        for (var j = artistList.length - 1; j >= 0; j--) {
                

            col.findOne({ _id : artistList[j]},function(err,artist){  
                if(err) throw err ;
                //console.log(artistList[j]);
               var totalConcerts = artist.gigs.length; //nombre total de concerts
               var totalKm = 0; //distance totale parcourue 
               var updatedGigs = artist.gigs.map(function(gig, i){
                    var nextGig = artist.gigs[i+1];  
                      
                      if (i < artist.gigs.length-1) {
                      
                        // Calcul des distances entres gigs et de la distance totale parcourue
                        var km = getKmFromLatLong(gig.venue.latitude, gig.venue.longitude, nextGig.venue.latitude,nextGig.venue.longitude ) ;
                        totalKm += km; 
                        gig.distanceToNextGig = km;           
                    
                    // Calcul des temps entres gigs et du temps total de tournées
                     gig.timeToNextGig = moment(nextGig.datetime).diff(moment(gig.datetime));
                    
                    //   console.log(totalKm,moment.duration(timeToNextGig).asDays())


                      }
                 
                   return gig;  
              })

               //Duree de la collection de dates de l'artiste
                var sortedGigs = artist.gigs.map(function(item, k){ return item.datetime; })
        
                  var timeTotour = moment(sortedGigs[sortedGigs.length-1]).diff(moment(sortedGigs[0]));
                    console.log("frequences de tournee")
                    console.log(sortedGigs.length);
                   console.log(moment.duration(timeTotour).asYears());
                   var frequencyOfTheGigs = (sortedGigs.length)/moment.duration(timeTotour).asYears();
                   console.log("fredgigs",frequencyOfTheGigs);
                //Calcul de la durée moyenne entre concerts
                
                    console.log("gig length", artist.gigs.length); 
                    var sumTotalToursTime = 0;
                    for (var m = 0; m <= artist.gigs.length - 1; m++) {
                        
                    
                 console.log("temps d'ici la prochaine date",moment.duration(artist.gigs[m].timeToNextGig).asDays());
                        sumTotalToursTime += parseFloat(moment.duration(artist.gigs[m].timeToNextGig).asDays()) ; 
                    
                    var meanTimeTonextGig = parseFloat((sumTotalToursTime)/(artist.gigs.length));
                    };
                  console.log("sumTotalToursTime",sumTotalToursTime);
                  console.log("meanTimeTonextGig",meanTimeTonextGig, "jours");
                  console.log("echo",moment.duration(meanTimeTonextGig).asDays());


                  //console.log(sortedGigs[0]);
                   //console.log(sortedGigs[sortedGigs.length-1]);
                  //  moment(sortedGigs.datetime).sort(){
                //gigmindate = gigdate.datetime[0];
                //gigmaxdate = gigdate.datetime[k];
                //  console.log(gigmindate)
                //  console.log(gigmaxdate)    

                 //   return ;
                 //  return  (gigmindate, gigmaxdate, new Date(gigmindate).getTime() - new Date(gigmaxdate).getTime()); 
              //} 
                    

           // newcol.insert({_id : artistList [j], gigs : updatedGigs });

        });
              
    };
  })
    // db.close();
})


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
        
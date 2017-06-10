Template.artist.helpers( {
    categories: function() {
        var artist = Artists.findOne();
        return [ "totalGigs", "totalKm", "meanOfGigsPerYear", "meanDelayBetweenGigs", "tourDutyCycle", "co2Spent" ].map( function( cat ) {
            return {
                name: cat,
                value: Math.round( artist[ cat ] * 1000 ) / 1000
            };
        } );
    },

    artist: function() {
        var artist = Artists.findOne();
        console.log(artist);
        return artist;
    }


  });
Template.gig.helpers( {
    formatDate: function( date ) {
        return moment( date ).format( "ddd. MMM Do YYYY, hh:mm A" );
    }
} );

Template.artist.events = {

      'click a[target=_blank]' : function(e){
          var artist = Artists.findOne();
          var win = window.open("https://musicbrainz.org/artist/"+artist.mbid, '_blank');
        //win.focus();

  }
    }

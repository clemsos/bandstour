Template.artist.helpers({
    categories : function(){
        return ["totalKm","meanOfGigsPerYear", "totalGigs", "meanDelayBetweenGigs", "co2Spent"]
    },
    
    artist : function() {
        var artist = Artists.findOne();
        console.log(artist);
        return artist;
    }
});
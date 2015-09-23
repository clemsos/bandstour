Meteor.publish('topArtists', function(count, category) {
    console.log(count, category);
    var acceptedTypes = ["totalKm","meanOfGigsPerYear", "totalGigs", "meanDelayBetweenGigs", "co2Spent"]

    // prevent failure
    if(acceptedTypes.indexOf(category) < 0) new Meteor.Error( 500, 'Wrong top index type' ); 

    // build filter
    var filter = { 'sort' : {},  'limit' : parseInt(count)};
    filter["sort"][category] = -1;

    return Artists.find( {}, filter);
});

Meteor.publish('artist', function (artistId) {
    var artists = Artists.find({'slug' : artistId});
    return artists;
});

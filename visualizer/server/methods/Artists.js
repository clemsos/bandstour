Meteor.methods({
    getGigsByArtist : function(artistName) {
         return Artists.findOne({ _id : artistName });
    },
    search : function(query, options) {
        options = options || {};

        // guard against client-side DOS: hard limit to 50
        if (options.limit) {
            options.limit = Math.min(50, Math.abs(options.limit));
        } else {
            options.limit = 50;
        }

        // TODO fix regexp to support multiple tokens
        var regex = new RegExp("^" + query);
        return Artists.find({name: {$regex:  regex}}, options).fetch();

    }
});

Template.menu.rendered = function() {
    Meteor.typeahead.inject();
};

Template.menu.helpers({
    lookupArtists : function(query, sync, callback) {
        Meteor.call('search', query, {}, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            callback(res.map(function(v){ return {value: v.name}; }));
        });
    }
});

Template.menu.events({
    'submit form': function (e, template) {
            e.preventDefault();
            var bandName = event.target.bandName.value;
            if( !bandName ) return;
            Router.go('/artists/' + slugify(bandName));
     }
});


function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

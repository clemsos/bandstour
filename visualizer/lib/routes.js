// Default routing settings
Router.configure({
  layoutTemplate: 'mainLayout',
  notFoundTemplate: '404'
});

Router.route('/', function() {
    return this.render("home");
});

Router.route('/top/:count/:category', {
    waitOn: function () {
      return Meteor.subscribe('topArtists', this.params.count, this.params.category);
    },
    action : function() {
        if (!this.ready()) 
            this.render("loading");
        else
            this.render('artists');
    }
});

Router.route('/artists/:artistId', {
    waitOn: function () {
        return Meteor.subscribe('artist', this.params.artistId)
    },
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('artist', { data : {"artistId" : this.params.artistId} });
    }
});

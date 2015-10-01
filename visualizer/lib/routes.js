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
            this.render('top');
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

Router.route('/artists/:artistId/timeline', {
    waitOn: function () {
        return Meteor.subscribe('artist', this.params.artistId)
    },
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('timeline', { data : {"artistId" : this.params.artistId} });
    }
});

Router.route('/artists/:artistId/map', {
    waitOn: function () {
        return Meteor.subscribe('artist', this.params.artistId)
    },
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('map', { data : {"artistId" : this.params.artistId} });
    }
});

Router.route('/artists/:networkId/nodes', {
    waitOn: function () {
        return Meteor.subscribe('nodes', this.params.networkId)
    },
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('nodes', { data : {"networkId" : this.params.networkId} });
    }
});

Router.route('/artists/:networkId/edges', {
    waitOn: function () {
        return Meteor.subscribe('edges', this.params.networkId)
    },
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('edges', { data : {"networkId" : this.params.networkId} });
    }
});

Router.route('/artists/:networkId/import', {
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('import', { data : {"networkId" : this.params.networkId, "type" : "nodes" } });
    }
});

Router.route('/artists/:artistId/network', {
    waitOn: function () {
        return [
            Meteor.subscribe('artist', this.params.artistId),
            Meteor.subscribe('nodes', this.params.artistId),
            Meteor.subscribe('edges', this.params.artistId)
        ]
    },
    action: function () {
        if (!this.ready())  this.render("loading");
        else this.render('network', { data : {"networkId" : this.params.artistId} });
    }
});


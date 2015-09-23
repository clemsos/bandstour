Template.artists.rendered = function(){
    this.artists = Artists.find().fetch();
}

Template.artists.helpers({
    artists : function() {
        return Artists.find().fetch();
    }
})

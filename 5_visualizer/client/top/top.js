Template.top.rendered = function(){
    this.artists = Artists.find().fetch();
}

Template.top.helpers({
    artists : function() {
        return Artists.find().fetch();
    }
})

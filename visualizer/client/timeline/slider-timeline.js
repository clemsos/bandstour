Template.timeSlider.created = function() {
      Session.setDefault("slider", [0, 1]);
};

Template.timeSlider.rendered = function() {

    // get gigs time
    var artist = Artists.findOne();

    // format date
    var timescale = Session.get("timescale");
    var dates = artist.gigs.map(function(d){ return moment(d.datetime).startOf(timescale).valueOf() });

    //
  /*  var max = d3.max(dates);*/
    var max = +artist.gigs[artist.gigs.length -1 ].datetime;
    console.log("max",max);

    var min = +artist.gigs[0].datetime;
    console.log("min",min);

    var step = Math.round( (max - min)/dates.length );

    // set
    Session.set("slider", [min, max]);
    Session.set("min", moment(min).format('YYYY-MM-DD') );
    Session.set("max", moment(max).format('YYYY-MM-DD') );
    Session.set("step", step );

    // build slider
    this.$("#slider").noUiSlider({
      start: Session.get("slider"),
      step : step,
      connect: true,
      range: {
        'min': min,
        'max': max
      }
    }).on('slide', function (ev, val) {
      Session.set( 'slider', [Math.round(val[0]), Math.round(val[1])] );
    }).on('change', function (ev, val) {
      Session.set( 'slider', [Math.round(val[0]), Math.round(val[1])] );
    });
};

Template.timeSlider.helpers({
    min : function() { return Session.get('min'); },
    max : function() { return Session.get('max'); },
    step : function() { return Session.get('step'); },
    start : function() {
      return Session.get('slider')[0]
    },
    isSelected : function(value) {
        return Session.get("timescale") == value;
    },
    end : function() {
      return Session.get('slider')[1]
    },
    startFormatted : function() {
       return moment(Session.get('slider')[0]).format('YYYY MM DD');  ;
    },
    endFormatted : function() {
       return moment(Session.get('slider')[1]).format('YYYY MM DD');  ;
    },
    stepFormatted : function() {
       return (Math.round((moment(Session.get('step'))/ 3600000))+" hrs")  ;
    }

});

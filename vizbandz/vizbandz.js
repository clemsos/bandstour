Shows = new Meteor.Collection("london_bandsintown");


function  initNetwork() {

  cy = cytoscape({
    container: document.getElementById('cy'),
    style: cytoscape.stylesheet()
      .selector('node')
        .css({
          'font-size': 10,
          'content': 'data(name)',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#888',
          'min-zoomed-font-size': 8,
          'width': 'mapData(score, 0, 1, 20, 50)',
          'height': 'mapData(score, 0, 1, 20, 50)'
        })
  });

   Tracker.autorun(function(){
   
   })
}

if (Meteor.isClient) {

    Meteor.subscribe('shows');


    Meteor.startup(function () {
      initNetwork()
      
        Meteor.call("getCommonShows",function (error, result) { 

      for (var i = 0; i < result.length; i++) {
             if (result[i].count == 2) {
              var id = _.values(result[i]._id).toString() ;
              cy.add([
                    { group: "nodes", data: { id: result[i]["artists"][0], name: result[i]["artists"][0] } , position: {x: i*10, y: 150}} ,
                    { group: "nodes", data: { id: result[i]["artists"][1],  name: result[i]["artists"][1] } , position: {x: i*10, y: 200}} ,  
                    { group : "edges", data: { id  : id,  source : result[i]["artists"][0], target : result[i]["artists"][1]} } 
              ])
             } else if (result[i].count > 2) {
              var pairs = pairwise(result[i].artists);
              for (var j = 0; j < pairs.length; j++) {
                  console.log( pairs[j][0],  pairs[j][1]);
                  // var id = _.values(result[i]._id).toString() ;
                 cy.add([
                    { group: "nodes", data: { id: pairs[j][0], name: pairs[j][0] } , position: {x: i*10, y: 50}} ,
                    { group: "nodes", data: { id: pairs[j][1], name: pairs[j][1] } , position: {x: i*10, y: 100}} ,  
                    { group : "edges", data: {  source : pairs[j][0], target : pairs[j][1]} } 
                ])
              } 
              }
        }
    });
    console.log(cy.nodes().length, cy.edges().length)


      $('#layout').on('click', function(){
        console.log('layout');
      var layout = cy.makeLayout({ name: 'cola' });
      layout.run();

    });

  });

    Template.body.helpers({
      shows: function () {
        return Shows.find({}, {sort: {datetime: -1}});
      }
    });

}

if (Meteor.isServer) {

  Meteor.startup(function () {

  Meteor.methods({

    getCommonShows: function () {
      console.log("compute similarities");

      // get common shows
      var commonShows = Shows.aggregate([
          {
              "$project": { // select fields
                  "artists" : 1 ,
                  "venue" : 1 ,
                  "y" : { "$year": "$datetime" },
                  "m" : { "$month": "$datetime" },
                  "d" : { "$dayOfMonth": "$datetime" }
              }
          },
          { $unwind: "$artists" } // développer array pour pouvoir en lire les valeurs
          , {
              "$group": { 
                  "_id": { // group by day
                      "year": "$y",
                      "month": "$m",
                      "day": "$d",
                      "venue_id" : "$venue.id"
                  }
                  , artists : { $push: "$artists.name"  } // gather artists name
                  , count: {
                      "$sum": 1 // count the number of artists
                  }
              }
          },
          {
              $sort: { // sort by day
                  "_id.year": 1,
                  "_id.month": 1,
                  "_id.day": 1
              }
          }
      ]);

      // console.log( commonShows );
      return commonShows
    }
  });
})


  //    // common shows
  

}




function pairwise(list) {
  if (list.length < 2) { return []; }
  var first = list[0],
      rest  = list.slice(1),
      pairs = rest.map(function (x) { return [first, x]; });
  return pairs.concat(pairwise(rest));
}

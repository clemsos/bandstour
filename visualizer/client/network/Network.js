NetworkGraph = {

    initNetwork : function  (_id) {
        console.log("initNetwok");
        this._id = _id;
        this.colors = d3.scale.category20b();

        var self = this;

        this.net = cytoscape({
                container: document.getElementById('cy'),
                ready: function(){

                    // console.log("network ready");
                    // self.initNetworkData(); // load data when cy is ready

                    // add everything
                    // self.addQTip();
                    self.addCxtMenu();
                    self.addMouseBehaviours();
                    self.addEdgehandles();
                },
                // style
                style: cytoscape.stylesheet()
                .selector('node')
                    .style({
                            // 'content': function( e ){ return e.data("name") },
                            'background-color': function( e ){return e.data("starred") ?  "yellow" : self.colors(e.data("group")) },
                            'font-size': 12,
                            'text-valign': 'center',
                            'color': 'white',
                            'text-outline-width': 2,
                            'text-outline-color': function( e ){ return e.locked() ?  "red" : "#888" },
                            'min-zoomed-font-size': 8
                             // 'width': 'mapData(score, 0, 1, 20, 50)',
                            // 'height': 'mapData(score, 0, 1, 20, 50)'
                    })
                .selector('edge')
                    .style({
                        // 'content': function( e ){ return e.data("name")? e.data("name") : "";},
                        'target-arrow-shape': 'triangle',
                    })
                .selector('.edgehandles-hover')
                    .style({
                         'background-color': 'red'
                    })
                .selector('.edgehandles-source')
                .selector('.edgehandles-target')
                .selector('.edgehandles-preview, .edgehandles-ghost-edge')
                    .style({
                        'line-color': 'red',
                        'target-arrow-color': 'red',
                        'source-arrow-color': 'red'
                    })
        });

        return this
    },


    updateNetworkData : function (nodes, edges) {

            console.log("updateNetworkData");

            this.net.elements().remove(); // make sure evything is clean

            // prevent edges to be added before nodes
            this.net.add( nodes );
            this.net.add( edges );

            this.net.reset() // render layout
    },

    addQTip : function  (){
        // qtip
        this.net.nodes().qtip({
              content:  function(){ return this.data('id'); }
        })
    },

    // contextual menu
    addCxtMenu  : function  (){
        this.net.cxtmenu({
            selector: 'node',
            commands: [
              {
                content: '<span class="fa fa-trash-o fa-2x"></span>',
                select: function(){
                  
                  // remove all connected edges
                  this.neighborhood('edge').forEach(function(el,i) {
                    // console.log(el.id());
                    Meteor.call("deleteEdge",el.id());
                  })

                  // remove this node
                  Meteor.call("deleteNode",this.id());

                  // remove from graph
                  net.remove( this.neighborhood('edge') )
                  net.remove( this )
                }
              },
              {
                content: '<span class="fa fa-star fa-2x"></span>',
                select: function(){
                  Meteor.call("starNode", this.id());
                  this.style({
                    'background-color': 'yellow'
                  })
                }
              },
              {
                content:'<span class="fa fa-lock fa-2x"></span>',
                select: function(){
                  // console.log( this.position() );
                  Meteor.call("lockNode", this.id(), this.position());
                },
              },
              {
                content:'<span class="fa fa-comments-o fa-2x"></span>',
                select: function(){
                  Meteor.call("addComment", this.id());
                },
                
              }
            ]
          });
    },

    // edgehandles
    addEdgehandles : function () {

        var onComplete = function( source, target, addedEntities ){
          Meteor.call("addEdge", source.data("id"), target.data("id"));
        }

        this.net.edgehandles({
            complete : onComplete
        });
    },

    // drag behaviour
    addMouseBehaviours : function  () {

        this.net.on('select', 'node', /*_.debounce(*/function( e ){
            var node = e.cyTarget;
            Session.set('currentType', "node");
            Session.set('currentId', node.id());
            $("#infoBox").css('visibility', 'visible');
        });

        this.net.on('select', 'edge', /*_.debounce(*/function( e ){
            var edge = e.cyTarget;
            Session.set('currentType', "edge");
            Session.set('currentId', edge.id());
            $("#infoBox").css('visibility', 'visible');
        });

        this.net.on('drag', 'node', /*_.debounce(*/function( e ){
            var node = e.cyTarget;
            Meteor.call('updateNodePosition', node.id(), node.position());
        })
    }
}

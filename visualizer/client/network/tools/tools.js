Template.networkTools.onCreated(function(){
    this.changeLayout = new ReactiveVar();

    // inherit change layout function from parent network view
    this.changeLayout.set(this.view.parentView._templateInstance.changeLayout.get())
});

Template.networkTools.events = {

    // add/remove nodes
    "click #add-node" :  function(){ 
        var nodeId =  'node' + Math.round( Math.random() * 1000000 );
        var node = makeNode(nodeId);
        Meteor.call("addNode", node);
    },

    // add random nodes 
    "click #init-data": function(){
        Meteor.call("resetNetworkData", this.networkId); 
    },

    // layouts
    'click #colaLayout' : function(e, template){  
        template.view.parentView._templateInstance.changeLayout.get()("cola"); 
    },
    'click #randomLayout' : function(e, template){
        template.view.parentView._templateInstance.changeLayout.get()("random");
    },
    'click #circleLayout' : function(e, template){  
        template.view.parentView._templateInstance.changeLayout.get()("circle") 
    },
    'click #gridLayout' : function(e, template){  
        template.view.parentView._templateInstance.changeLayout.get()("grid") 
    },
    'click #breadthfirstLayout' : function(e, template){  
        template.view.parentView._templateInstance.changeLayout.get()("breadthfirst") 
    },
    'click #concentricLayout' : function(e, template){  
        template.view.parentView._templateInstance.changeLayout.get()("concentric") 
    },

    // toggle add/remove edges feature
    'click #draw-edgehandles' : function(){

        // var edgeHandlesOn = Session.get('edgeHandlesOn') == "drawoff" ? "drawon" : "drawoff";
        // var edgeHandlesOn = Session.get('edgeHandlesOn') == 'disable' ? 'enable' : 'disable';

        var edgeHandlesOn = Session.get('edgeHandlesOn') ? false : true ;
        Session.set('edgeHandlesOn', edgeHandlesOn);
        console.log(edgeHandlesOn);
        if (edgeHandlesOn)net.edgehandles.start();
    },

    // degree
    'click #remove-isolated-nodes' : function() {
        // var network = Template.instance().network.get().net;
        var isolated = network.elements("node[[degree = 0]]")
        network.remove(isolated);
    }



}



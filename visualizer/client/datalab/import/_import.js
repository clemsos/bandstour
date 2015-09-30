Template.import.onCreated( function() {
    Session.set('newLayerDataReady', false);
    Session.set('dataFields', []);
});

Template.import.helpers({
    getLayerType : function(){
        return Session.get('newLayerType');
    },
    isEdges : function() {
        return Session.get('newLayerType') === "edges";
    },
    isNodes : function() {
        return Session.get('newLayerType') === "nodes";
    },
    dataIsReady : function() {
        return Session.get('newLayerDataReady');
    },
    getAsLatLng : function() {
        return Session.get('asLatLng');
    },
    getDataFields : function() {
        return Session.get('dataFields');
    }

});

Template.import.events = {

    "change #layerType" : function(e, t) {
        Session.set('newLayerType', e.currentTarget.value);
    },

    "change #layerData": function(e) {

        var type = Session.get('newLayerType')

        // TODO : make UI for those options
        var parsingOptions = {
            header: true
        };
        
        var data = Papa.parse(e.currentTarget.value, parsingOptions);
        console.log(data);

        if(data.errors.length) {
            for (var i = 0; i < data.errors.length; i++) {
                
                Session.set('newLayerDataReady', false);
                var message = "CSV parsing Error ";
                if(data.errors[i].row) message += "at row: " + data.errors[i].row + " "; 
                message += data.errors[i].message;
                FlashMessages.sendError(message);

            }
        } else {
                var message = type+ " CSV parsed succesfully : "+ data.data.length + " records";
                FlashMessages.sendSuccess(message);

                // keep data
                Session.set('newLayerDataReady', true);
                Session.set('dataFields', data.meta.fields );
        }
    },

    "change .add-geo-info input": function (event) {
      Session.set("asLatLng", event.target.checked);
    },

    "submit #importForm" : function(e) {
        e.preventDefault();

        var self = this;
        console.log(self);

        // Get value from form elements
        var type = e.target.layerType.value,
            csv = e.target.layerData.value;

        // init 
        var srcField
            ,targetField
            ,idField
            ,latField
            ,lngField;

        // TODO : make UI for those options
        var parsingOptions = {
            header: true
        };

        var data = Papa.parse(csv, parsingOptions);
        console.log(data);

        // check for errors in CSV
        if(data.errors.length || !Session.get('newLayerDataReady')) {
            FlashMessages.sendError("CSV contains errors, please fix before submitting");
            return; // end function
        }

        // check for errors in vars
        if(type == "edges") {

            srcField = e.target.srcField.value;
            targetField =  e.target.targetField.value;

            // check if src and target have been set correctly
            if( !targetField || !srcField || (targetField == srcField) ) {
                    FlashMessages.sendError("Please define source and target");
                    return;
            }

        } else if (type == "nodes") {

            idField = e.target.idField.value;

            // parse latitude / longitude
            if(Session.get('asLatLng')) {
                latField =  e.target.latField.value;
                lngField =  e.target.lngField.value;

                // add nodes
                if( !idField || !latField || !lngField || (latField == lngField) ) {
                    FlashMessages.sendError("Please define lat / lng / ID fields");
                    return;
                }
            }
        }

        // parse data
        var parsedData = data.data.map(function  (d) {

            // parse geo coords
            var lat = 0, lng = 0;
            if (Session.get('asLatLng')) { lat = d[latField]; lng = d[lngField]; }

            // parse data
            if (type == "nodes" ) return makeNode(self.networkId, d[idField], lat, lng, 0, 0, d);
            else if (type == "edges") return makeEdge(self.networkId, d[srcField], d[targetField], d);
        });
        
        // console.log(parsedData);

        /// TODO : display loader
        if(type == "edges") {
            Meteor.call("batchInsertEdges", parsedData, function (edges) {
                console.log(data.data.length, " edges added");
                FlashMessages.sendSuccess("Success ! : " +data.data.length + " edges created.");
            })
        } else if (type == "nodes") {
            Meteor.call("batchInsertNodes", parsedData, function(nodes){
                console.log(data.data.length, " nodes added");
                FlashMessages.sendSuccess("Success ! : " +data.data.length + " nodes created.");
            })
        }

    }
}

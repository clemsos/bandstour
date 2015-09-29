/*Template.searchbox.rendered = function( ) {
    Meteor.typeahead.inject( );
    Meteor.typeahead( 'input#search', function( ) {

    } )
};*/

/*Template.searchbox.helpers( {
    lookupArtists: function( query, sync, callback ) {
        Meteor.call( 'search', query, {}, function( err, res ) {
            if ( err ) {
                console.log( err );
                return;
            }
            callback( res.map( function( v ) {
                return {
                    value: v.name
                };
            } ) );
        } );
    }
} );*/

Template.searchbox.events( {
    'submit form': function( e, template ) {
        e.preventDefault( );
        var bandName = event.target.bandName.value;
        if ( !bandName ) return;
        Router.go( '/artists/' + slugify( bandName ) );
    },

    'click .mdi-navigation-close': function( e ) {
        e.preventDefault( );
        document.getElementById("search").value = '';
    },

    'keyup #search': function( e ) {
        console.log( event.target.value );
        if( event.target.value != ''){
            Meteor.call( 'search', slugify( event.target.value ), {}, function( err, res ) {
                if ( err ) {
                    console.log( err );
                    return;
                }
                console.log( res.map( function( v ) {
                    return {
                        value: v.name
                    };
                } ) );
            } );
        }
    }
} );

function slugify( text ) {
    return text.toString( ).toLowerCase( )
        .replace( /\s+/g, '-' ) // Replace spaces with -
        .replace( /[^\w\-]+/g, '' ) // Remove all non-word chars
        .replace( /\-\-+/g, '-' ) // Replace multiple - with single -
        .replace( /^-+/, '' ) // Trim - from start of text
        .replace( /-+$/, '' ); // Trim - from end of text
}

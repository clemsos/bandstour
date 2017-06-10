Template.searchbox.events( {
    'submit form': function( e, template ) {
        e.preventDefault( );
        var bandName = event.target.bandName.value;
        if ( !bandName ) return;
        Router.go( '/artists/' + slugify( bandName ) );
        document.getElementById( "search" ).value = '';
    },

    'click #dropdown1>li': function( ) {
        document.getElementById( "search" ).value = '';
    },

    'click #searchClose': function( e ) {
        e.preventDefault( );
        document.getElementById( "search" ).value = '';
    },

    'keyup #search': function( e ) {
        // console.log( event.target.value );
        if ( event.target.value != '' ) {
            Meteor.call( 'search', slugify( event.target.value ), {}, function( err, res ) {
                if ( err ) {
                    console.log( err );
                    return;
                }
                $( "#dropdown1>li" ).remove( );
                res.forEach( function( r ) {
                    $( "#dropdown1" ).append( "<li><a href=\"/artists/" + r.slug + "\">" + r.name + "</a></li>" );
                } );
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

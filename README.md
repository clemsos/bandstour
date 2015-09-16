# Bandstour

Visualization of bands touring around - and their carbon footprints.
Yeah!

## How it works

* ```crawler``` (Python) :  crawl all data (gigs) from [Bands in Town API](http://www.bandsintown.com/api/overview). Store all crawled gigs to Mongo in a collections named "bandsintown"
* ```parser``` (node) : create a list of all venues (collection "venues") and a  sub-samples of well-formatted data in 3 mongo collections : "selectedGigs", "selectedArtists", "selectedVenues"
* ```miner``` (node) : extract info and calculate metrics
* ```vizbandz``` (meteor) : visualization engine for network and geo mapping 

## Notes

To link the mongo with Meteor

    export MONGO_URL=mongodb://localhost:27017/bandstour






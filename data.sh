#!/bin/bash 

# Bands touring in London & Paris

wget -O data/paris.json https://app.bandsintown.com/events/popular\?location\=Paris%2C+France\&radius\=150\&per_page\=100\&date\=2015-06-14\&authenticate\=false 

wget -O data/london.json https://app.bandsintown.com/events/popular\?location\=London%2C+UK\&radius\=150\&per_page\=100\&date\=2015-06-14\&authenticate\=false 

# https://app.bandsintown.com/events/popular?location=London%2C+UK&radius=75&authenticate=false

wget -O data/london2.json https://app.bandsintown.com/events/popular\?location\=London%2C+UK\&radius\=150\&per_page\=100\&date\=2015-06-14\&authenticate\=false&page=2

#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import urllib
import time
import csv
import math
import os

# dir
places_dir = "data/places/"
artists_dir = "data/artists/"

# API
PLACE_BASE_URL = "https://app.bandsintown.com/events/popular/?location=PLACE&radius=10&per_page=100&authenticate=false&page=PAGE_NUMBER"
DATES_BASE_URL = "http://api.bandsintown.com/artists/ARTIST/events.json?app_id=YOUR_APP_ID&date=all"
bands_urls=[]

def get_filename(place, page_number):
    return places_dir + place.split("%")[0]+ "_" + str(page_number) +".json" 

def get_page_url(place, page_number):
    url = PLACE_BASE_URL.replace("PLACE", place) # base url
    return url.replace("PAGE_NUMBER", str(page_number))

def get_page(place, page_number):

    f = get_filename(place, page_number)

    # check if the file already exists
    if not os.path.isfile(f):
        print f, " downloading"
        time.sleep(1)
        url = get_page_url(place, page_number)
        urllib.urlretrieve( url , filename=f)
    else :
        print f, " already exists"

def get_dates_from_place(place):

    # save first page
    page = get_page(place, 1)

    # compute number of pages
    with open( get_filename(place, 1) ) as data_file:
        page = json.load(data_file)
        nb_of_pages =  int( math.ceil( int(page["pages"]["total_results"]) / int(page["pages"]["results_per_page"]) ) ) + 2
        print "  total", place, nb_of_pages

    # crawl api
    for page_number in range(2, nb_of_pages) :
        # print place, str(page_number), "/", str(nb_of_pages)
        get_page(place,  page_number)

# parse places
places = []
with open('list_villes/sousprefs') as souspref_file:
    places = souspref_file.read().splitlines()

with open('list_villes/prefs') as pref_file:
    places += pref_file.read().splitlines()

# get data from places
for place in places :
    place.replace(' ',"%20")

    place = place+"%2C+France"
    # print  get_page_url(place, 1)
    try :
        get_dates_from_place(place)
    except :
        print "ERROR :",  place

# get a unique list of artists 
artists = []
for f in os.listdir(places_dir):
    # print "--- ", f
    if f != "_1.json" : 
        with open(os.path.join(places_dir,f)) as data_file:    
            try :
                data = json.load(data_file)
                for event in data["data"]["events"] : 
                    for artist in event["artists"]:
                        if artist["name"] not in artists : artists.append(artist["name"])
                        # print artist["name"]
            except ValueError :
                pass # json not parsable

print "total : %s artists"%len( set(artists) )

# crawl all artists
for i, artist in enumerate(artists) :
    f = os.path.join(artists_dir, artist.replace(" ", "_").replace("/", "_") + ".json")
    print str(i) + "/" + str(len(artists))
    if not os.path.isfile(f):
        url = DATES_BASE_URL.replace("ARTIST", artist.replace(' ',"%20")).encode('utf8')
        print "download : ", url
        urllib.urlretrieve( url , filename=f)
        time.sleep(1)
    else :
        print f, "already exists"

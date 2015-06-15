#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import urllib
import time
import csv
import math
import os

PLACE_BASE_URL = "https://app.bandsintown.com/events/popular/?location=PLACE&radius=10&per_page=100&authenticate=false&page=PAGE_NUMBER"

DATES_BASE_URL = "http://api.bandsintown.com/artists/ARTIST/events.json?app_id=YOUR_APP_ID"
bands_urls=[]

def get_filename(place, page_number):
    return "data/place/"+ place.split("%")[0]+ "_" + str(page_number) +".json" 

def get_page_url(place, page_number):
    url = PLACE_BASE_URL.replace("PLACE", place) # base url
    return url.replace("PAGE_NUMBER", str(page_number))

def get_page(place, page_number):

    f = get_filename(place, page_number)

    # check if the file already exists
    if not os.path.isfile(f):  
        print f, " downloading"
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
        nb_of_pages =  math.ceil( int(page["pages"]["total_results"]) / int(page["pages"]["results_per_page"]) ) +1
        print "  total", place, nb_of_pages

    # crawl api
    for page_number in range(2, int(nb_of_pages)+1) :
        time.sleep(1)
        # print place, str(page_number), "/", str(nb_of_pages)
        get_page(place,  page_number)

# places = ["London%2C+UK", "Lyon%2C+France", "Paris%2C+France"]

places = []
with open('list_villes/sousprefs') as souspref_file:
    places = souspref_file.read().splitlines()

with open('list_villes/prefs') as pref_file:
    places += pref_file.read().splitlines()

# places = ["Saint-Jean-d’Angély"] # reproduce error

for place in places :
    if place != "":  place.replace(' ',"%20")
    place = place+"%2C+France"
    # print  get_page_url(place, 1)
    try :
        get_dates_from_place(place)
    except :
        print "ERROR :",  place

# with open('data/london.json') as data_file:    
#     data = json.load(data_file)
#     for event in data["data"]["events"] : 
#         for artist in event["artists"]:
#             print artist["name"]

#             url = DATES_BASE_URL.replace("ARTIST", artist["name"].replace(' ',"%20")).encode('utf8')
#             urllib.urlretrieve( url , filename="data/artists/" + artist["name"] + ".json")


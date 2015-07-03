import os
import json
import pymongo
from datetime import datetime
from pymongo import MongoClient

from dateutil import parser

# setup mongo
client = MongoClient()
db = client["bandstour"]
bandsintown =  db["bandsintown"]

# source data
DATA_FOLDER = "data/artists"
count = 0

# date parsing
DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'

for f in os.listdir(DATA_FOLDER):
    # print count, f
    statinfo = os.path.getsize(os.path.join(DATA_FOLDER, f))
    if(statinfo > 500): 
        with open(os.path.join(DATA_FOLDER, f)) as shows_file: 
            try : 
                shows = json.load( shows_file)
            except ValueError :
                shows = [] 

            for show in shows : 
                # print show["datetime"], show["venue"]["country"]
                count = count +1
                show["datetime"] = parser.parse(show["datetime"])
                bandsintown.insert(show)
    else : 
        print "FILE ERROR :%s "%f
        # city  = lookup_city( show["venue"]["city"] )
        # venue = lookup_venue( show["venue"]["city"] )
        # show = lookup_show( show["datetime"], show["artists"] )

print count


# def lookup_venue( venue ):
#     # look for venue
#     if venue not exists : 
#         create venue
#     else :
#         return venue

# def lookup_city( city ):
#         if city not exists : 
#             create_city
#         else : 
#             return city

# def lookup_show(date, artists):
#     return 


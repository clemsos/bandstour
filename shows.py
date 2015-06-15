import os
import json
import pymongo
from datetime import datetime
from pymongo import MongoClient

# setup mongo
client = MongoClient()
db = client["bandstour"]
bandsintown =  db["london_bandsintown"]

# source data
DATA_FOLDER = "data/artists"
count = 0

# date parsing
DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'

for f in os.listdir(DATA_FOLDER):
    with open(os.path.join(DATA_FOLDER, f)) as shows_file:    
        shows = json.load( shows_file)

        for show in shows : 
            # print show["datetime"], show["venue"]["country"]
            count = count +1
            show["datetime"] = datetime.strptime(show["datetime"], DATETIME_FORMAT)
            bandsintown.insert(show)


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


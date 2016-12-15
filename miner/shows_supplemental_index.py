import os
import json
import pymongo
import musicbrainzngs
import arrow
from datetime import datetime
from pymongo import MongoClient

from dateutil import parser

# setup mongo
client = MongoClient()
db = client["bandstour"]
bandsintown =  db["bandsintown"]
#setup mbrainz client
musicbrainzngs.set_useragent("Example music app", "0.1", "http://example.com/music")

# source data
DATA_FOLDER = "data/labels"
countMBID = 0
countNAME = 0
count = 0
# date parsing
DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'
DATETIME_FORMAT_FOR_MSBNS ='%Y-%m-%d'
#retrieve label for each artist before a tour starts
for artist in db.minedArtists.find() :

                    if  artist["mbid"] is None:
                        print ("NOMBID for",artist["name"])

    #                     try :
    #                         print(musicbrainzngs.browse_releases( artist["name"], includes=["labels"] ))
    #                     except musicbrainzngs.musicbrainz.ResponseError as e:
    # # catastrophic error. bail.
    #                         print e
    #                         #sys.exit(1)


                    else:

                        artist["releases"]=(musicbrainzngs.browse_releases( artist["mbid"], release_type=["album"], includes=["labels"] ))
                        #artist["release_groups"]=(musicbrainzngs.browse_release_groups( artist["mbid"],release_type=["album"], includes=["tags"]))
                        print artist["releases"]
                        print "...."
                        #print artist["release_groups"]
                        for release in  artist["releases"]["release-list"]:
                            print release
                            if  release.has_key("release-event-list"):
                                print "title",release["title"]
                                #print "label-list",release["label-info-list"]
                                for label in release["label-info-list"]:
                                    print "label",label["label"]["sort-name"]
                                    print "labelid",label["label"]["id"]
                                releDate=release["release-event-list"][0]
                                #print "releDate", release["release-event-list"][0]
                                if  releDate.has_key("date"):
                                    print "date", releDate["date"]
                                else:
                                    print "NORELEASEDATE2"
                            else:
                                print "NORELEASEDATE"


                            # print ("title",release["title"])
                            # for date in release["release-event-list"]:
                            #     print date["date"]
                            # # print ("date", release['release-event-list']["date"])
                            # print "...."
                            # for label in release["label-info-list"]:
                            #     print "label",label["label"]["sort-name"]
                            #     print "...."
                            #     print "labelid",label["label"]["id"]
                    #,date=[ mindatedisc TO  tourBegining ]
                    #     result = musicbrainzngs.
#                        art = disc.artist( artist["mbid"])
#                        print art
                    #countMBID = countMBID +1
#count = count +1

        # city  = lookup_city( show["venue"]["city"] )
        # venue = lookup_venue( show["venue"]["city"] )
        # show = lookup_show( show["datetime"], show["artists"] )

#                 for tour in artist["tours"] :
#
#                     # date parsing
#                     tourBegining = tour["gigs"][0]["datetime"].strftime('%Y-%m-%d')
#                     print tourBegining
#                     arw = arrow.get(tourBegining)
#                     #min date time for a record:6months before tour)
#                     mindatedisc = arw.replace(months=-6).strftime('%Y-%m-%d')
#                     print mindatedisc
#
#
# print count
# print countMBID
# print countNAME


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

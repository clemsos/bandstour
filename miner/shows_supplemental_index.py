import os
import json
import pymongo
import musicbrainzngs
import arrow
from datetime import datetime
from pymongo import MongoClient
from collections import defaultdict
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
labels_aliases ={}
for artist in db.minedArtists.find() :
                    #print db.minedArtists[artist]
                    #print artist
                    labels_dict= defaultdict(list)
                    labels_dict["id"]=[]

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
                        #print "artist",artist
                        print "...."
                        #print artist["release_groups"]
                        key= 0
                        for release in  artist["releases"]["release-list"]:
                            #print release
                            if  release.has_key("release-event-list"):
                                #print "artist_name:",artist["name"]
                                #print "albumtitle:",release["title"]
                                #print "albumid:",release["id"]
                                #print "label-list",release["label-info-list"]
                                for label in release["label-info-list"]:
                                    #print "label:",label["label"]["sort-name"]
                                    #print "labelid:",label["label"]["id"]

                                    if label["label"]["id"] not in labels_dict["labids"]:
                                        labels_dict["labids"].append(label["label"]["id"])
                                        labels_dict[label["label"]["id"]]={}

                                        labels_dict[label["label"]["id"]]["label_name"]=label["label"]["sort-name"]
                                        labels_dict[label["label"]["id"]]["label_id" ]=label["label"]["id"]
                                        #WE Build the label aliases tables here so that all labels have their relationships##
                                        if label["label"]["id"] not in labels_aliases:
                                            labels_aliases[label["label"]["id"]] = musicbrainzngs.get_label_by_id(label["label"]["id"], includes=["aliases", "annotation", "area-rels", "label-rels", "place-rels"])
                                        #print "labels_aliases",labels_aliases
                                        # labels_dict[key].append(label["label"]["id"])
                                        # artist["labels"]["name"]=label["label"]["sort-name"]
                                #if     release["id"] not in artist["labels"]["titles"]:


                                    labels_dict[label["label"]["id"]][key]={}
                                    print key
                                    labels_dict[label["label"]["id"]][key]["album_id"]=release["id"]
                                    labels_dict[label["label"]["id"]][key]["album_title"]=release["title"]
                                    # artist["labels"]["titles"]=release["id"]
                                    # artist["labels"]["titles"]["name"]=release["title"]
                                    releDate=release["release-event-list"][0]
                                #print "releDate", release["release-event-list"][0]
                                    if  releDate.has_key("date"):
                                        dateRel=arrow.get(releDate["date"])
                                        print "date:", dateRel.strftime('%Y-%m-%d')
                                    # artist["labels"]["titles"]["date"]=dateRel.strftime('%Y-%m-%d')
                                    ##labels_dict[label["label"]["id"][key]].append({"album_date":dateRel.strftime('%Y-%m-%d')})
                                        labels_dict[label["label"]["id"]][key]["album_date"]=dateRel.strftime('%Y-%m-%d')
                                    key = key +1
                                    #NOW we make a nice lightweight object to push to mongo

                                else:
                                    print "NORELEASEDATE2"
                                    #key = key +1
                            else:
                                #key = key +1
                                print "NORELEASEDATE"

                            print labels_dict
                            db.minedArtists.artist.insert_one(labels_dict)
                            print labels_aliases
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

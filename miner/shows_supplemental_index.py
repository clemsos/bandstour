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
DATETIME_FORMAT_FOR_MSBNZ ='%Y-%m-%d'
# init label_db_retrieval
labels_aliases ={}
#retrieve label for each artist before a tour starts
#i.e what is the album previously to the first year
for artist in db.minedArtists.find() :
                    print artist["name"]
    
                    #print db.minedArtists[artist]
                    #print artist
                    labels_dict= defaultdict(list)
                    labels_dict["id"]=[]

                    if  artist["mbid"] is ( None ) :
                        print ("NOMBID for",artist["name"])

                    else:
                     if  bool(artist["mbid"]) is ( False ) :
                      print ("NOMBID2 for",artist["name"])

                     else:
                      print "aartist_mbid", artist["mbid"]
                      try:
                        artist["releases"]=(musicbrainzngs.browse_releases( artist["mbid"], release_type=["album"], includes=["labels"] ))
                            
                                  
                        #print "...."
                        #print artist["release_groups"]
                        key= 0
                        for release in  artist["releases"]["release-list"]:
                            #print release
                            if  release.has_key("release-event-list"):
                                #print "artist_name:",artist["name"]
                                #print "albumtitle:",release["title"]
                                #print "albumid:",release["id"]
                                #print "label-list",release["label-info-list"]
                                print "release",release
                                if 'label' in release["label-info-list"]:
                                 for label in release["label-info-list"]:
                                    #WE NEED TO TEST HERE
                                    #print "label:",label["label"]["sort-name"]
                                    #print "labelid:",label["label"]["id"]
#WE CREATE A DICTIONNARY WITH OUR FIELDS, WITH FORMAT
                                    if label["label"]["id"] not in labels_dict["labids"]:
                                        labels_dict["labids"].append(label["label"]["id"])
                                        labels_dict[label["label"]["id"]]={}

                                        labels_dict[label["label"]["id"]]["label_name"]=label["label"]["sort-name"]
                                        labels_dict[label["label"]["id"]]["label_id" ]=label["label"]["id"]
#WE Build the label aliases tables here so that all labels have their relationships##
                                        if label["label"]["id"] not in labels_aliases:
                                            labels_aliases[label["label"]["id"]] = musicbrainzngs.get_label_by_id(label["label"]["id"], includes=["aliases", "annotation", "area-rels", "label-rels", "place-rels"])
                                        #print "labels_aliases",labels_aliases
                                    labels_dict[label["label"]["id"]][str(key)]={}
                                    #print key
                                    labels_dict[label["label"]["id"]][str(key)]["album_id"]=release["id"]
                                    labels_dict[label["label"]["id"]][str(key)]["album_title"]=release["title"]
                                    releDate=release["release-event-list"][0]
                                #print "releDate", release["release-event-list"][0]
                                    if  releDate.has_key("date"):
                                        dateRel=arrow.get(releDate["date"])
                                        #print "date:", dateRel.strftime('%Y-%m-%d')
                                        labels_dict[label["label"]["id"]][str(key)]["album_date"]=dateRel.strftime('%Y-%m-%d')
                                    key = key +1
                                #else:
                                    #print "NORELEASEDATE2"
                                    #key = key +1
                            #else:
                                #key = key +1
                                #print "NORELEASEDATE"
#NOW we make a nice lightweight object to push to mongo
                        labels_dict["name"]=artist["name"]
                        print labels_dict,'\r\n'
                        db.labels_dict_per_artist.update({'myid': artist["name"] } ,labels_dict, upsert=True, multi=False)
                      except  musicbrainzngs.ResponseError:
                        print "oups",artist["name"]

                #with open(os.path.join(DATA_FOLDER,artist["name"],".json"), 'w') as outfile:
                             #   json.dump(labels_dict, outfile)
                            #db.minedArtists.artist.insert_one(labels_dict)
#with open(os.path.join(DATA_FOLDER,"label_equiv_table.json"), 'w') as outfile:
 #                               json.dump(labels_aliases, outfile)
print labels_aliases,'\r\n\r\n\r\n'
  
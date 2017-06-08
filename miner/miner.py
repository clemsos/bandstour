import os
import json
import pymongo
import re
#import musicbrainzngs
import arrow
from datetime import datetime
from dateutil.relativedelta import relativedelta
from pymongo import MongoClient
from collections import defaultdict
from dateutil import parser
from datetime import *
from geopy.distance import vincenty
from math import sqrt,ceil

def slugify(s):
    """
    Simplifies ugly strings into something URL-friendly.
    >>> print slugify("[Some] _ Article's Title--")
    some-articles-title
    """

    s = re.sub('\s+', ' ', s)
    s = s.replace(' ', '-')

    s = re.sub('\W', '', s)

    s = s.strip()

    s = s.lstrip()
    return s

# setup mongo
client = MongoClient()
db = client["bandstour"]
bandsintown =  db["bandsintown"]
#setup mbrainz client
#musicbrainzngs.set_useragent("Example music app", "0.1", "http://example.com/music")

# source data
DATA_FOLDER = "data/labels"
countMBID = 0
countNAME = 0
count = 0
# date parsing
DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'
DATETIME_FORMAT_FOR_MSBNZ ='%Y-%m-%d'
DELTA_BETWEEN_DATES = 10
PLANE_DISTANCE = 1500
MINIMUM_DATES = 5
ARRET_WRONG = ""
# init label_db_retrieval
labels_aliases ={}
#retrieve label for each artist before a tour starts
#i.e what is the album previously to the first year
for artist in db.selectedArtists.find() :
    print artist["_id"]
    if len(artist["gigs"]) > MINIMUM_DATES:

        totalKm = 0 #distance totale parcourue
        timeOnTour = 0
        timeOffTour = 0

        tours = []
        tour = {}
        tgigs = []
        singleGigs = []
        tourInProgress = 0

        i=0
        while  i<= (len(artist["gigs"])-2):
            nextgig= artist["gigs"][ i + 1 ]
            gig=artist["gigs"][ i ]
            i += 1
            #print gig
            #TODO:save mv coords as an array for easy access for  dijkstra and tsne
            km=vincenty(gig["venue"]["latitude"],gig["venue"]["longitude"],nextgig["venue"]["latitude"],nextgig["venue"]["longitude"]).kilometers
            print km
            totalKm += km
            gig["distanceToNextGig"] = km
            #print nextgig["datetime"]
            #print gig["datetime"]
            #print (nextgig["datetime"]-gig["datetime"]).days
            gig["timeToNextGig"] =  (nextgig["datetime"]-gig["datetime"]).days
            #print "GIGDIFFTIME", gig["timeToNextGig"]
            if gig["timeToNextGig"] <= DELTA_BETWEEN_DATES:
                if tourInProgress==0:
                    tour={}
                    tour["gigs"]= []
                tour["gigs"].append(gig)
                tourInProgress = 1
                timeOnTour += gig["timeToNextGig"]
            else:
                if tourInProgress==0:
                    singleGigs.append(gig)
                    tourInProgress =0
                else:
                    tour["distance"]=0
                    for g in xrange(0,len(tour["gigs"]),1):
                        tour["distance"]+=tour["gigs"][g]["distanceToNextGig"]
                    tour["gigs"].append(gig)
                    tour["nbGigs"]=len(tour["gigs"])
                    tourInProgress =0
                    tours.append(tour)

                timeOffTour += gig["timeToNextGig"]
            if i== (len(artist["gigs"])-2):
                if tourInProgress == 1:
                    tour["distance"]=0

                    for d in xrange(0,len(tour["gigs"]),1):
                        print len(tour["gigs"])
                        tour["distance"]+= tour["gigs"][ d ]["distanceToNextGig"]
                    #tour["gigs"].append(gig)
                    tour["gigs"].append(nextgig)
                    tour["gigs"].append(artist["gigs"][ i + 1 ])
                    tour["nbGigs"]= len(tour["gigs"])
                    tourInProgress=0
                    tours.append(tour)
                    print tour
                    print timeOnTour
                    print timeOffTour
                else:
                    print "SINGLE GIG DETECTED"
                    singleGigs.append(nextgig)
                    singleGigs.append(artist["gigs"][ i + 1 ])
                    tourInProgress=0


        nbDatesOnTour = 0;
        for n in xrange(0,len(tours),1):
            nbDatesOnTour+=len(tours[n]["gigs"])
        print  "nbDatesOnTour",nbDatesOnTour ,"sing gigs",len(singleGigs),"total",len(artist["gigs"])



        if nbDatesOnTour +len(singleGigs) != len(artist["gigs"]):
            print "WRONG DATE COUNT!!!!"
            ARRET_WRONG ="STOP"

        if nbDatesOnTour > 0:
            meanTourLength = nbDatesOnTour / len(tours)
            sqEcarts = []
            sumSqEcarts = 0
            t=0
            print "tours\n", tours
            while t < len(tours):
                sqEcart = (len(tours[ t ]["gigs"]) - meanTourLength)**2
                print len(tours[ t ]["gigs"]),meanTourLength, sqEcart

                sqEcarts.append(sqEcart)
                sumSqEcarts += sqEcart
                t +=1

                ecartType= sqrt(sumSqEcarts / len(sqEcarts))
        else:
            ecartType= None
        print ecartType
        print artist["gigs"][0]["datetime"]
        print artist["gigs"][len(artist["gigs"])-1]["datetime"]
        #totalTime=map (artist["gigs"]["datetime"])
        totalTimeAsDays= abs(artist["gigs"][0]["datetime"] - artist["gigs"][len(artist["gigs"])-1]["datetime"]).days
        if totalTimeAsDays < 365.25:
            totalTimeAsYears = 1

        elif totalTimeAsDays % 365.25 > (365.25 /3):
            totalTimeAsYears= ceil( totalTimeAsDays / 365.25)
        else:
            totalTimeAsYears= round( totalTimeAsDays / 365.25)

        print "timeasdays" ,totalTimeAsDays
        print totalTimeAsYears
        tourDutyCycle = timeOnTour / totalTimeAsDays
        meanOfGigsPerYear = len(artist["gigs"]) / totalTimeAsYears


        meanDelayBetweenGigs = totalTimeAsDays  / len(artist["gigs"])
        co2Spent = totalKm /3

        #// store values
        artist["name"] = artist["_id"]
        artist["slug"] = slugify( artist["_id"] )
        del  artist["_id"]  #remove id to allow auto mongo id
        artist["tours"] = tours
        artist["singleGigs"] = singleGigs
        artist["totalKm"] = totalKm
        artist["totalGigs"] = nbDatesOnTour + len(singleGigs)
        artist["ecartType"] = ecartType
        artist["tourDutyCycle"] = tourDutyCycle
        artist["meanOfGigsPerYear"] = meanOfGigsPerYear
        artist["meanDelayBetweenGigs"] = meanDelayBetweenGigs
        artist["co2Spent"] = co2Spent
        print artist
        print len(artist["gigs"])
        if ARRET_WRONG =="STOP":
            break

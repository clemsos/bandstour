import json
import urllib

DATES_BASE_URL = "http://api.bandsintown.com/artists/ARTIST/events.json?app_id=YOUR_APP_ID"
bands_urls=[]

with open('data/london.json') as data_file:    
    data = json.load(data_file)
    for event in data["data"]["events"] : 
        for artist in event["artists"]:
            print artist["name"]

            url = DATES_BASE_URL.replace("ARTIST", artist["name"].replace(' ',"%20")).encode('utf8')
            urllib.urlretrieve( url , filename="data/artists/" + artist["name"] + ".json")


import json
import urllib
import time
import csv

PLACE_BASE_URL = "https://app.bandsintown.com/events/popular/?location=PLACE&radius=150&per_page=100&authenticate=false&page=PAGE_NUMBER"

DATES_BASE_URL = "http://api.bandsintown.com/artists/ARTIST/events.json?app_id=YOUR_APP_ID"
bands_urls=[]

def get_filename(place, page_number):
    return "data/place/"+ place+ "_" + str(page_number) +".json" 

def get_page_url(place, page_number):
    urllib.urlretrieve( url.replace("PAGE_NUMBER", str(page_number)), filename=get_filename(place.split("%")[0], 1) ) 

def get_dates_from_place(place):

    # base url
    url = PLACE_BASE_URL.replace("PLACE", place)

    # save first page
    page = get_page_url(place, 1)

    # compute number of pages
    with open( get_filename(place, 1) ) as data_file:    
        page = json.load(data_file)
        nb_of_pages = round( page["pages"]["total_results"] / page["pages"]["results_per_page"])

    # crawl api
    for page_number in range(2, int(nb_of_pages)) :
        time.sleep(1)
        print page_number + "/" + nb_of_pages
        get_page(place,  page_number)

# places = ["London%2C+UK", "Lyon%2C+France", "Paris%2C+France"]


for place in places :
    print place


# with open('data/london.json') as data_file:    
#     data = json.load(data_file)
#     for event in data["data"]["events"] : 
#         for artist in event["artists"]:
#             print artist["name"]

#             url = DATES_BASE_URL.replace("ARTIST", artist["name"].replace(' ',"%20")).encode('utf8')
#             urllib.urlretrieve( url , filename="data/artists/" + artist["name"] + ".json")


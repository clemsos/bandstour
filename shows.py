import os
import json

DATA_FOLDER = "data/artists"

for f in os.listdir(DATA_FOLDER):
    with open(os.path.join(DATA_FOLDER, f)) as shows_file:    
        shows = json.load( shows_file)
        for show in shows : 

            print show["datetime"], show["venue"]["country"]

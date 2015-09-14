#!/usr/bin/env python
# -*- coding: utf-8 -*-
from pymongo import MongoClient
import json
import urllib
import time
import csv
import math
import os
from subprocess import call
"""from topogram.processor import Processor"""

import networkx as nx
from  itertools import permutations

import logging
logger = logging.getLogger('topogram.processors.graph')


"""call("mongoexport", "--db bandstour --collection artists_list --out artists.json")"""

data_artists= []
f = open('../artists2.json');

data_artists = json.loads(f.read())

f.close()

"""g = open('../exportbands_all_venues-1.json');

data_venues = json.loads(g.read())

f.close()"""



def __init__(self, directed=False):
        logger.info("Init network graph visualization")
        if directed : 
            self.g = nx.DiGraph()
        else :
            self.g = nx.Graph()

def add_nodes(self,datanodes):
		for row in datanodes :
			retrieve_edges(datanodes.row['_id'])
		return


def retrieve_edges(self, vari):
		posts = {}
		client = MongoClient('mongodb://localhost:27017/')
		db = client['bandsintown']
		collection = db['bandstour']
		for post in db.collection.find({"artist": vari }).sort("datetime"): 
			posts.append(post)
		return posts


def main():
	print(add_nodes(data_artists))


""" 
	# compute graph
    def add_edges_from_nodes_list(self, nodelist):
        "" Compute and add relationships to graph from a list of nodes. 
            This assume that each node in this list is connected to each other in a similar fashion (weight=1)
        "" 
        for node in list(permutations(set(nodelist), 2)) : # pair the words
            self.add_edge(node[0], node[1])

    def add_edge(self, nodeA, nodeB):
        if self.g.has_edge(nodeA, nodeB):
            self.g[nodeA][nodeB]['weight'] += 1
        else:
            self.g.add_edge(nodeA, nodeB, weight= 1)

    def __call__(self, nodes):
        if type(nodes) is list : 
            self.add_edges_from_nodes_list(nodes)
        elif type(nodes) is tuple : 
            self.add_edge(*nodes)
        return self.g.edges()
"""



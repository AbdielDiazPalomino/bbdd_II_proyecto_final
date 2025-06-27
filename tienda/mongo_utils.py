# tienda/mongo_utils.py
from pymongo import MongoClient
from django.conf import settings

def get_mongo_client():
    return MongoClient('mongodb://localhost:27017/')

def get_comments_db():
    client = get_mongo_client()
    return client['metal_cisneros_comments']
from pymongo import MongoClient

# setup mongo
client = MongoClient()
db = client["bandstour"]
bandsintown =  db["london_bandsintown"]

# print bandsintown.aggregate([
#             { $match: { status: "A" } },
#              { $group: { _id: "$cust_id", total: { $sum: "$amount" } } },
#              { $sort: { total: -1 } }
#             ])

print bandsintown.group(
)

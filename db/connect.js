const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

let db;

async function connectToDatabase() {
  try {
    client.connect();
    db = client.db("fitnexus");
  } catch (error) {}
}

function getDB() {
  return db;
}

module.exports = { connectToDatabase, getDB };

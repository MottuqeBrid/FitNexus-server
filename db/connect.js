const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("fitnexus");
    console.log("Connected to MongoDB (native driver)");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

function getDB() {
  return db;
}

module.exports = { connectToDatabase, getDB };

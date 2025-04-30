const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db('chat_220');

module.exports = db;
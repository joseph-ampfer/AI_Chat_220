const express = require('express');
const {MongoClient, ServerApiVersion} = require('mongodb');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

const uri = process.env.DATABASE_URI;
// Your endpoints start at /api/pagination
// So router.get('/')  ===  GET '/api/pagination/  OR  /api/pagination?page=2&limit=20
// So router.get('/all) === POST '/api/pagination/all'
// etc...

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db('chat_220');

// GET '/api/pagination/  OR  /api/pagination?page=2&limit=20
router.get('/', async (req, res) => {
  const cursor = db.collection('publicChats').find().sort({"chat.timestamp":-1});
  const publicChats = await cursor.toArray();
  console.log(publicChats);
  res.json(publicChats);
});

module.exports = router;
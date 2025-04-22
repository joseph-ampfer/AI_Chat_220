const express = require('express');
const db = require('../db');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// GET '/api/search/  OR  /api/search?page=2&limit=20
router.get('/', async (req, res) => {
  try{
  const cursor = db.collection('publicChats').find().sort({"chat.timestamp":-1});
  const publicChats = await cursor.toArray();
  }catch(err){
    res.status(500).json(err);
  }
  console.log(publicChats);
  res.json(publicChats);
});

module.exports = router;
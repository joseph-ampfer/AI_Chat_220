const express = require('express');
const db = require('../db');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// GET '/api/pagination/  OR  /api/pagination?page=2&limit=20
router.get('/', async (req, res) => {
  let publicChats;
  try{
  const cursor = db.collection('publicChats').find().sort({"chat.timestamp":-1});
  publicChats = await cursor.toArray();
  }catch(err){
    res.status(500).json(err);
  }
  console.log(publicChats);
  res.json(publicChats);
});

module.exports = router;
const express = require('express');
const db = require('../db');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// GET '/api/search/:input
router.get('/:input', async (req, res) => {
  const input = req.params.input;
  const regex = new RegExp(input, 'i');
  try{
  const cursor = db.collection('publicChats').find(({
    $or: [
      { "username": { $regex: regex } },
      { "chat_summary.title": { $regex: regex } },
      { "chat_summary.summary": { $regex: regex } }
    ]
  })).sort({"chat.timestamp":-1});
  const results = await cursor.toArray();
    res.json(results);
  }catch(err){
    res.status(500).json(err);
  }
});

module.exports = router;
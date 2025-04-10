// routes/api.js
const express = require('express');
const { callChatAPI } = require('../controllers/chatController');

const router = express.Router();




// POST /api/chat
router.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    // You’d call OpenAI API or similar here
    const response = await callChatAPI(userMessage); // assume this is a function you define

    res.json({ reply: response });
  } catch {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
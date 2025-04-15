// routes/api.js
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { Readable } = require('stream');
const { File } = require('formdata-node'); // polyfill for browser File API
const Groq = require("groq-sdk");
  
// For future
const { callChatAPI } = require('../controllers/chatController');

// So we can define routes here
const router = express.Router();

// Setting up groq instance
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getGroqChatCompletionTest() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama-3.3-70b-versatile",
    stream: false
  });
}

// Returns completions object
async function getGroqChatCompletion(messages, model) {
  return groq.chat.completions.create({
    messages: messages,
    model: model,
    stream: false
  });
}



// POST /api/test-chat
router.post('/test-chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    // You’d call OpenAI API or similar here
    // const response = await callChatAPI(userMessage); // assume this is a function you define

    // res.json({ reply: response });

    const stream = await getGroqChatCompletionTest();
    for await (const chunk of stream) {
      // Print the completion returned by the LLM
      //console.log(chunk.choices[0]?.delta?.content || "");
      res.write(chunk.choices[0]?.delta?.content || "");
    }
    //console.log(chatCompletion.choices[0]?.message?.content || "");

    res.end();

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/chat
router.post('/chat', async (req, res) => {
  const messsages = req.body.messages;
  const model = req.body.model;

  try {
    const chatCompletion = await getGroqChatCompletion(messsages, model);
    res.send(chatCompletion.choices[0]?.message?.content || "");
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/transcriptions
router.post('/transcriptions', upload.single('file'), async (req, res) => {
  console.log(req.body);
  if (!req.file) {
    console.error("No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  console.log("File received:", req.file);

  // Create a File object that mimics the browser File API
  const file = new File([req.file.buffer], req.file.originalname, {
    type: req.file.mimetype,
  });

  // Create a transcription job
  const transcription = await groq.audio.transcriptions.create({
    file: file, // Required path to audio file - replace with your audio file!
    model: req.body.model, // Required model to use for transcription
    prompt: req.body.prompt, // Optional
    response_format: req.body.response_format, // Optional
    //timestamp_granularities: ["word", "segment"], // Optional (must set response_format to "json" to use and can specify "word", "segment" (default), or both)
    language: req.body.language, // Optional
    temperature: req.body.temperature, // Optional
  });

  // To print only the transcription text, you'd use console.log(transcription.text); (here we're printing the entire transcription object to access timestamps)
  console.log(JSON.stringify(transcription, null, 2));

  res.json(transcription);

});

// POST /api/summarize-chat
router.post('/summarize-chat', async (req, res) => {
  const messages = req.body.messages;
  const model = req.body.model;

  let systemPrompt = {
    role: "system",
    content: `You an assistant that summarizes chats in JSON like they would appear in reddit. A title that is a question, and a detail that is a 30 word summary. The JSON schema should include
          {
            "chat_summary": {
              "title": "string (as a question)",
              "summary": "string (about 30 words)"
            }
          }`,
  };

  // Make new convo with system prompt at the beginning
  let convoWithSystemPrompt = [systemPrompt, ...messages];

  try {
    const completion = await groq.chat.completions.create({
      messages: convoWithSystemPrompt,
      model: model,
      response_format: { type: "json_object" }
    });
      
    const summary = completion.choices?.[0]?.message?.content;
    console.log(summary);
    res.json(summary);

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }

});

module.exports = router;
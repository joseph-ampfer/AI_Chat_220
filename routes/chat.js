// routes/api.js
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { Readable, pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);
const { File } = require('formdata-node'); // polyfill for browser File API (used in transcription)
const Groq = require("groq-sdk");
const { z } = require('zod');
const db = require('../db');
const { ObjectId } = require('mongodb');
const modelCapabilities = require('../config/modelCapabilities');
  
// For future
const { callChatAPI } = require('../controllers/chatController');
const { error } = require('console');
const { title } = require('process');
const { generateReadUrl } = require('../helpers/filesHelpers');
const authorizeUser = require('../middleware/authorizeUser');
const fs = require('fs');
const { fetchTextOnlyConversation } = require('../services/chatServices');


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
    stream: true,
    stream_options: { include_usage:true },
  });
}

// Returns a summary
async function summarizeConversation(conversation, model) {
  const systemPrompt = {
    role: "system",
    content: `
    You are an assistant that summarizes chats into JSON objects like they would appear in reddit. A title that is a question, and a detail that is a 30 word summary. Always respond with valid JSON objects that match this structure:
    {
      "chat_summary": {
        "title": "string",
        "summary": "string"
      }
    }
    Your response should ONLY contain the JSON object and nothing else.`,
  };

  // Make new convo with system prompt at the beginning
  const convoWithSystemPrompt = [systemPrompt, ...conversation];
  console.log(convoWithSystemPrompt);
  console.log("llama-3.3-70b-versatile");

  // Summarize
  return await groq.chat.completions.create({
    messages: convoWithSystemPrompt,
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" } // IMPORTANT! will throw if not proper JSON
  });

}

// POST /api/chats/test-chat
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


// POST /api/chats/transcriptions
router.post('/transcriptions', authorizeUser, upload.single('file'), async (req, res) => {
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

// POST /api/chats/tts
router.post('/tts', authorizeUser, async (req, res) => {
  const text = req.body.text;

  const speechFilePath = "Basil-PlayAI.wav";
  const model = "playai-tts";
  const voice = "Basil-PlayAI";
  const responseFormat = "mp3";
  
  // 1) Generate the audio
  const response = await groq.audio.speech.create({
    model: model,
    voice: voice,
    input: text,
    response_format: responseFormat
  });

  // 2) Turn it into a Node Buffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3) (Optional) save locally
  // await fs.promises.writeFile("Basil-PlayAI.wav", wavBuffer);

  // 4) Send it back with the right headers
  res.set({
    "Content-Type": "audio/mpeg",
    "Content-Length": buffer.length,
    // make browsers treat it as a download if you like:
    // "Content-Disposition": 'attachment; filename="speech.wav"'
  });
  res.send(buffer);
});

// TESTING GET /api/chats/tts
router.get('/tts', authorizeUser, async (req, res) => {
  const { text } = req.query;

  const speechFilePath = "Basil-PlayAI.wav";
  const model = "playai-tts";
  const voice = "Basil-PlayAI";
  const responseFormat = "mp3";
  
  // 1) Generate the audio
  const response = await groq.audio.speech.create({
    model: model,
    voice: voice,
    input: text,
    response_format: responseFormat
  }).asResponse(); // get the raw Response

  // tell the client it’s chunked WAV
  res.setHeader("Content-Type", "audio/mpeg");
  // no Content-Length → Transfer-Encoding: chunked

  // pipe the Node Readable (PassThrough) directly into Express’s res
  await pipe(response.body, res);
  // .pipe(res) would also work, but pipeline() gives you error handling
});

// POST /api/chats/:chatId/post-public?autoSummarize=true
router.post('/:chatId/post-public', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);
  const { model, username } = req.body;
  const { chatId } = req.params;

  // Get conversation by id to send to summarizer
  // Not vision model, deconstruct all content: [] to content: "string"
  const conversation = await fetchTextOnlyConversation(chatId, userId);
  if (!conversation.length) {
    return res.status(404).json({ error: "Chat not found" });
  }  

  try {
    // Summarize
    const completion = await summarizeConversation(conversation, model);

    // Got the summary
    const summary = completion.choices?.[0]?.message?.content;
    console.log(summary);
    const jsonSummary = JSON.parse(summary);

    // Get the original chat?
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId: userId });
    const user = await db.collection('users').findOne({ _id: userId }, { projection: { username: 1, email: 1 } });

    // Post original chat and summary to publicChats
    const insertRes = await db.collection('publicChats').insertOne({
      username: user?.email?.split('@')[0], /// ????
      userId: userId,
      createdAt: new Date(),
      chat_summary: jsonSummary.chat_summary,
      conversation: chat.conversation,
      isImageChat: chat.isImageChat
    });

    res.json({
      chat_summary: jsonSummary.chat_summary,
      url: `/chats?chatId=${insertRes.insertedId}`
    });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }

});

const getChatSchema = z.object({

});


// GET '/api/chats/
// List chats (sidebar)
const userid = z.string()
router.get('/', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const results = await db.collection('chats')
    .find({ userId: userId })
    .project({ _id: true, title: true, updatedAt: true, isImageChat: true })
    .sort({ updatedAt: -1 }).toArray();
  res.json(results);
});


// GET '/api/chats/:chatId
// Get a single conversation from user
router.get('/:chatId', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const { chatId } = req.params;
  const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId: userId });
  
  // Walk through each message and generate url for images, parallel bc of async
  const promises = chat.conversation.map(async message => {
    const fileId = message.content?.[1]?.image_url?.key;
    if (!fileId) return;

    const url = await generateReadUrl(message.content[1].image_url.key);
    message.content[1].image_url = { url: url };
  });

  await Promise.all(promises);

  if (!chat) return res.status(404).send({ error: 'Chat not found' });
  res.json(chat);
});

// GET '/api/chats/:chatId/public
// anyone can view...
router.get('/:chatId/public', async (req, res) => {
  const { chatId } = req.params;
  const chat = await db.collection('publicChats').findOne({ _id: new ObjectId(chatId) });

  // Walk through each message and generate url for images, parallel bc of async
  const promises = chat.conversation.map(async message => {
    const fileId = message.content?.[1]?.image_url?.key;
    if (!fileId) return;

    const url = await generateReadUrl(message.content[1].image_url.key);
    message.content[1].image_url = { url: url };
  });

  await Promise.all(promises);

  if (!chat) return res.status(404).send({ error: 'Chat not found' });
  res.json(chat);
});

// GET '/api/chats/:chatId/public
router.get('/:chatId/public', async (req, res) => {
  const { chatId } = req.params;
  const chat = await db.collection('publicChats').findOne({ _id: new ObjectId(chatId) });

  // Walk through each message and generate url for images, parallel bc of async
  const promises = chat.conversation.map(async message => {
    const fileId = message.content?.[1]?.image_url?.key;
    if (!fileId) return;

    const url = await generateReadUrl(message.content[1].image_url.key);
    message.content[1].image_url = { url: url };
  });

  await Promise.all(promises);

  if (!chat) return res.status(404).send({ error: 'Chat not found' });
  res.json(chat);
});

const ModelEnum = z.enum([
  'gemma2-9b-it',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-guard-3-8b',
  'llama3-70b-8192',
  'deepseek-r1-distill-llama-70b',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
]);

const messageScheme = z.object({
  text: z.string(),
  model: ModelEnum,
  fileId: z.string().optional(),
});

// POST '/api/chats/:chatId/messages
// Continue a convo (convo already exists), send chatId
router.post('/:chatId/messages', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const { chatId } = req.params;
  if (!ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: 'Invalid chatId' });
  }

  const parseResult =  messageScheme.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parseResult.error.errors,
    });
  };

  const { text, model, fileId } = parseResult.data;

  const capablity = modelCapabilities[model] || { vision: false };

  console.log(parseResult.data);

  // Build content in one place
  let contentPayload;
  let url;
  if (capablity.vision) { 
    contentPayload = [{ type: 'text', text: text }];
    if (fileId) {
      console.log('inside if (fileid)');
      // Get temp url
      url = await generateReadUrl(fileId);
      console.log(url);
      // Build content
      contentPayload.push({
        type: 'image_url',
        image_url: { key: fileId },  // change to { url: url } when sending to ai model
      });
    } 
  } else {
    // plain chat models just take a string, not an array
    contentPayload = text;
  }

  // Add user message to mongodb
  await db.collection('chats').updateOne(
    { _id: new ObjectId(chatId), userId: userId },
    { $set: { updatedAt: new Date() }, $push: { conversation: { 'role': 'user', 'content': contentPayload, 'sentAt': new Date() } } }
  );


  // Use pipeline to get clean text only conversation, if txt model
  let conversation

  if (capablity.vision) {
    const chatObject = await db.collection('chats').findOne(
      { _id: new ObjectId(chatId), userId: userId },
      { projection: { _id: false, 'conversation.role': true, 'conversation.content': true } }
    );
    conversation = chatObject.conversation;

    // Changing image_url from {id:fileId} to {url:url}
    // Walk through each message and generate url for images, parallel bc of async
    const promises = conversation.map(async message => {
      const fileId = message.content?.[1]?.image_url?.key;
      if (!fileId) return;

      const url = await generateReadUrl(message.content[1].image_url.key);
      message.content[1].image_url = { url: url };
    });
    await Promise.all(promises);
    
  } else {
    // Not vision model, deconstruct all content: [] to content: "string"
    conversation = await fetchTextOnlyConversation(chatId, userId);
  }
  let aiResponse = "";
  let usage;
  // Send to ai
  try {
    // Change to for await loop to send chunks
    const stream = await getGroqChatCompletion(conversation, model);
    for await (const chunk of stream) {
      // Print the completion returned by the LLM
      res.write(chunk.choices[0]?.delta?.content || "");
      aiResponse += chunk.choices[0]?.delta?.content || "";
      usage = chunk.usage; // Total usage is only in last chunk, otherwise null
    }
   
    // const chatCompletion = await getGroqChatCompletion(conversation, model);
    // const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    // res.send(aiResponse);

    // Store ai reply to mongodb
    await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId), userId: userId },
      { $push: { conversation: { 'role': 'assistant', 'content': aiResponse, 'model':model, 'usage': usage, 'sentAt': new Date() } } }
    );
  } catch (err) {
    console.error('Chat error:', err.message);
    //res.status(500).json({ error: 'Something went wrong' });
    res.write('There was an error: ', err);
  } finally {
    res.end();
  }

});

const newChatSchema = z.object({
  title: z.string()
});

// Create a new chat, return its chatId 
// POST '/api/chats
router.post('/', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const parseResult =  newChatSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parseResult.error.errors,
    });
  };

  const { title } = parseResult.data;

  const now = new Date();

  // Insert new document
  const { insertedId } = await db.collection('chats').insertOne({
    userId: userId, title: title, createdAt: now, updatedAt: now, isImageChat: false, conversation: []
  });

  res.status(201).json(insertedId);

});

// Create a new chat, return its chatId 
// POST '/api/chats/continue-public-convo
router.post('/continue-public-convo', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);
  const { chat } = req.body;

  const now = new Date();

  // Insert new document
  const { insertedId } = await db.collection('chats').insertOne({
    userId: userId, title: chat.chat_summary.title, createdAt: now, updatedAt: now, isImageChat: chat.isImageChat, conversation: chat.conversation
  });

  res.status(201).json(insertedId);

});

// DELETE /api/chats/${chatId}/delete
router.delete('/:chatId/delete', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const { chatId } = req.params

  const response = await db.collection('chats').deleteOne({ _id: new ObjectId(chatId), userId: userId });
  console.log(response);

  res.status(200).json({status:"deleted"});
});


// PATCH /api/chats/${chatId}/rename
router.patch('/:chatId/rename', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const { chatId } = req.params

  const parseResult = newChatSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parseResult.error.errors,
    });
  };

  const { title } = parseResult.data;

  const response = await db.collection('chats').updateOne(
    { _id: new ObjectId(chatId), userId: userId }, { $set: { title: title } }
  );
  console.log(response);

  res.status(200).json({status:"successfully renamed"});
});


const imageGenRouteScheme = z.object({
  text: z.string(),
  model: z.string(),
  fileId: z.string(),
});

// POST /api/chats/${chatId}/imageGen
router.post('/:chatId/imageGen', authorizeUser, async (req, res) => {
  const userId = new ObjectId(req.user.id);

  const { chatId } = req.params;
  if (!ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: 'Invalid chatId' });
  }

  const parseResult =  imageGenRouteScheme.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parseResult.error.errors,
    });
  };

  const { text, model, fileId } = parseResult.data;

  console.log(parseResult.data);

  // Build content in one place
  let contentPayload = [
    { type: 'text', text: "" },
    {
      type: 'image_url',
      image_url: { key: fileId },  // change to { url: url } when sending to ai model
    }
  ];

  // Add user message to mongodb
  await db.collection('chats').updateOne(
    { _id: new ObjectId(chatId), userId: userId },
    {
      $set: { updatedAt: new Date(), isImageChat: true },
      $push: {
        conversation: {
          $each: [
          { 'role': 'user', 'content': text, 'sentAt': new Date() },
          { 'role': 'assistant', 'content': contentPayload, 'model': model, 'sentAt': new Date(), }
          ]
        }
      }
    }
  );
});

module.exports = router;
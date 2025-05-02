// routes/api.js
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { Readable } = require('stream');
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

// POST /api/summarize-chat
router.post('/summarize-chat', authorizeUser, async (req, res) => {
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
// Get a single conversation
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


  // This junk is to allow vision models and txt models to overlap
  // Getting only text for txt models, the imageurls for image models
  const pipline = [
    { $match: { _id: new ObjectId(chatId), userId: userId } },
    {
      $project: {
        _id: false,
        conversation: {
          $map: {
            input: "$conversation",
            as: "msg",
            in: {
              role: "$$msg.role",
              content: {
                $cond: [
                  { $isArray: "$$msg.content" },
                  // If it’s an array, find the text block and extract its `.text`
                  {
                    $first: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$$msg.content",
                            as:    "blk",
                            cond:  { $eq: [ "$$blk.type", "text" ] }
                          }
                        },
                        as:    "t",
                        in:    "$$t.text"
                      }
                    }
                  },
                  "$$msg.content"
                ]
              }
            }
          }
        }
    }}
  ];

  // Use pipline to get clean text only conversation, if txt model
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
    const chatArr = await db.collection('chats').aggregate(pipline).toArray();
    conversation = chatArr[0].conversation;
  }
  
  // Send to ai
  try {
    const chatCompletion = await getGroqChatCompletion(conversation, model);
    const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    res.send(aiResponse);
    
    // Store ai reply to mongodb
    await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId), userId: userId },
      { $push: { conversation: { 'role': 'assistant', 'content': aiResponse, 'model':model, 'usage':chatCompletion.usage, 'sentAt': new Date() } } }
    );
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
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

  res.status(201).json(insertedId)

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
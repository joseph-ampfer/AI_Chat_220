require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt')
const path = require('path');
const fs = require('fs');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DATABASE_URI;
const apiRoutes = require('./routes');


// Middleware
app.use(express.json());

// Static public files
app.use(express.static('public'));

const PORT = 3030;

/* ==== HTML ENDPOINTS ===== */
// app.get('/', (req, res)=> {
// 	res.send(fs.readFileSync('./index.html','utf8'));
// })

// app.get('/detail', (req, res)=> {
// 	res.send('HTML endpoint: detail');
// })

// Clean routes for HTML pages (website.com/chat instead of website.com/chat.html)
app.get('/:page', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`));
  } else {
    next();
  }
});

// API ENDPOINTS 
// Routes in routes folder, so we dont clog up this file
// Exposes everything in routes at '/api/'
app.use('/api', apiRoutes);

// ======= TESTING DB Connection =======
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db('chat_220');

// !TESTING! GET /mongodb
app.get('/mongodb', async (req, res) => {
  const cursor = db.collection('users').find();
  const users = await cursor.toArray();
  console.log(users);
  res.json(users);
});
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// Starting our app
app.listen(PORT, () => {
  console.log(`Example app listening on PORT ${PORT}`);
  console.log('http://localhost:3030/')
})

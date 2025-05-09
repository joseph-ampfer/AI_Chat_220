require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const apiRoutes = require('./routes');
const db = require('./db');
const cookieParser = require('cookie-parser');


// Middleware
app.use(cookieParser());
app.use(express.json()); // Parses application/json 
app.use(express.urlencoded({ extended: true })); // Parses application/x-www-form-urlencoded

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


// Starting our app
app.listen(PORT, () => {
  console.log(`Example app listening on PORT ${PORT}`);
  console.log('http://localhost:3030/')
})

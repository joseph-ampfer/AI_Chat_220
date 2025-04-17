const express = require('express');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// Your endpoints start at /api/files
// So router.get('/')  ===  GET '/api/files/
// So router.post('/upload) === POST '/api/files/upload'
// etc...

module.exports = router;
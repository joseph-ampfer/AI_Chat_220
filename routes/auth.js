const express = require('express');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// Your endpoints start at /api/auth
// So router.get('/')  ===  GET '/api/auth/
// So router.post('/login) === POST '/api/auth/login'
// etc...

module.exports = router;
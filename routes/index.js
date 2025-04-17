const express = require('express');
const auth = require('./auth');
const chat = require('./chat');
const pagination = require('./pagination');
const files = require('./files');

const router = express.Router();

// mount each sub-router under a path
router.use('/auth', auth);                // '/api/auth'
router.use('/chat', chat);                // '/api/chat'
router.use('/pagination', pagination);    // '/api/pagination'
router.use('/files', files);              // '/api/files'

module.exports = router;

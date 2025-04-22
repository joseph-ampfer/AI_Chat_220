const express = require('express');
const auth = require('./auth');
const chat = require('./chat');
const pagination = require('./pagination');
const files = require('./files');
const jsonBlob = require('./jsonBlob');
const search = require('./search');

const router = express.Router();

// mount each sub-router under a path
router.use('/auth', auth);                // '/api/auth'
router.use('/chat', chat);                // '/api/chat'
router.use('/pagination', pagination);    // '/api/pagination'
router.use('/files', files);              // '/api/files'
router.use('/jsonBlob', jsonBlob);        // 'api/jsonBlob'
router.use('/search', search);            // 'api/search'

module.exports = router;

const express = require('express');

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// Your endpoints start at /api/pagination
// So router.get('/')  ===  GET '/api/pagination/  OR  /api/pagination?page=2&limit=20
// So router.get('/all) === POST '/api/pagination/all'
// etc...

/* PERSONAL NOTES, REMOVE WHEN DONE 
make call to pagination and get public posts in the get db. Look at class notes to find directly how to do this.
*/

module.exports = router;
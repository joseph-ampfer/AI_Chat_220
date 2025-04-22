const express = require('express');

const db = require('../db');



// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// Your endpoints start at /api/auth
// So router.get('/')  ===  GET '/api/auth/
// So router.post('/login) === POST '/api/auth/login'
// etc...

// GET api/auth/check-email
router.get('/check-email', async (req, res) => {
    const {email} = req.query;
    if (!email) {
        return res.status(400).json({error: 'Email is required'});
    }
    try {
        const usersCollection = db.collection('users');
        const existingUser = await usersCollection.findOne({email});

        if (existingUser) {
            return res.status(200).json({exists: true});
        }
        else {
            return res.status(200).json({exists: false});
        }
    }
    catch (err) {
        console.log('Error checking email:', err);
        res.status(500).json({error: 'Error checking email'});
    }
});

// POST api/auth/signup 
router.post('/signup', async (req, res) => {
    const {email, password} = req.body;

    //checking that email/password were entered
    if (!email || !password) {
        return res.status(400).json({error: 'Email and password are required'});
    }

    try {
        const usersCollection = db.collection('users');

        //checking email in use
        const existingUser = await usersCollection.findOne({email});
        if (existingUser) {
            return res.status(400).json({error: 'Email is in use'});
        }

        //checking password length
        if (password.length < 7 || !/\d/.test(password)) {
            return res.status(400).json({error: 'Password must be longer than 7 characters and have a number'})
        }

        //checking email "validity" using a regular expression
        const emailExpression = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailExpression.test(email)) {
            return res.status(400).json({error: 'Email address is not a valid email'})
        }
        

        //adding user to database after checks
        await usersCollection.insertOne({email, password});
        res.status(201).json({success: 'User added to database'});
    }
    catch (err) {
        res.status(500).json({ message: 'Error adding to database'});
    }

});

module.exports = router;
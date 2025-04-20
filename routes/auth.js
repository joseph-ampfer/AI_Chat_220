const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://xanderjm1116:<password>@cluster0.sbcwer2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// Your endpoints start at /api/auth
// So router.get('/')  ===  GET '/api/auth/
// So router.post('/login) === POST '/api/auth/login'
// etc...

let database;

client.connect()
    .then(() => {
        database = client.db('Chat220');
        console.log('Connected to database')
        
    })
    .catch(err => console.log('Issue connecting to database:', err));


router.get('/check-email', async (req, res) => {
    const {email} = req.query;
    if (!email) {
        return res.status(400).json({error: 'Email is required'});
    }
    try {
        const usersCollection = database.collection('users');
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


router.post('/signup', async (req, res) => {
    const {email, password} = req.body;

    //checking that email/password were entered
    if (!email || !password) {
        return res.status(400).json({error: 'Email and password are required'});
    }

    try {
        const usersCollection = database.collection('users');

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
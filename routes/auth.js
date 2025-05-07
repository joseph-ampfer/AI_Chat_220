require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { OAuth2Client } = require('google-auth-library');
const authorizeUser = require('../middleware/authorizeUser');

const CLIENT_ID = process.env.GOOGLE_OATH2_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);


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
        

        //hashing the password with bcrypt
        const hashedpass = await bcrypt.hash(password, 10);

        //adding user to database after checks
        await usersCollection.insertOne({email, hashedpass});
        res.status(201).json({success: 'User added to database'});
    }
    catch (err) {
        res.status(500).json({ message: 'Error adding to database'});
    }

});



// POST api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Incorrect email or password' });
        }

        const matching = await bcrypt.compare(password, user.hashedpass);
        if (!matching) {
            return res.status(400).json({ error: 'Incorrect email or password' });
        }
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + (3 * 24 * 60 * 60);
        const token = jwt.sign({ userId: user._id, iat: iat, exp: exp }, process.env.JWT_SECRET);
        
        // 2) Send it as a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // True: only send over https, so only if node_env == production
            sameSite: 'lax',
            maxAge: 3600 * 1000 * 24 * 3, // 3 days, gets deleted
        });

        res.status(200).json({ success: 'login sucessful' });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// GET api/auth/status
// Check if logged in, by cookie
router.get('/status', authorizeUser, async (req, res) => {
    if (!req.cookies.token) return res.sendStatus(401);
    // optionally verify JWT here…
    res.json({ authenticated: true, user: req.user });
});

//  api/auth/logout
// Clear the cookie for logout
router.delete('/session', (req, res) => {
    // Clear the same cookie name + options you used when setting it
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.sendStatus(204);
});
  
  

// POST api/auth/oath2/callback/google
router.post('/oath2/callback/google', async (req, res) => {
    console.log('HIT OATH2 ENPOINT');

    // 1) CSRF
    //    We use the double-submit-cookie pattern to prevent CSRF attacks
    const csrf_token_cookie = req.cookies.g_csrf_token;
    if (!csrf_token_cookie) {
        res.status(400).json({error: 'No CSRF token in Cookie.'});
    }
    const csrf_token_body = req.body.g_csrf_token;
    if (!csrf_token_body) {
        res.status(400).json({error: 'No CSRF token post body.'});
    }
    if (csrf_token_body != csrf_token_cookie) {
        res.status(400).json({error: 'Failed to verify double submit cookie.'});
    }

    // 2) Verify the ID token
    const idToken = req.body.credential; // The google ID token
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (err) {
        console.error('ID token verification failed', err);
        res.status(401).json({ error: 'Invalid ID token' });
    }

    // 3) At this point, the user is authenticated!
    //    Look up or create your own user record, then establish a session:
    try {
        const user = await findOrCreateUser({
            googleId: payload.sub,
            email:    payload.email,
            name:     payload.name,
            picture:  payload.picture,
        });

        // 1) Build own JWT
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + (3 * 24 * 60 * 60); // 3 days
        const token = jwt.sign({userId: user._id, iat: iat, exp: exp}, process.env.JWT_SECRET);
        
        // 2) Send it as a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // True: only send over https, so only if node_env == production
            sameSite: 'lax',
            maxAge: 3600 * 1000 * 24 * 3, // 3 days, gets deleted
        });

        // 3. Redirect back to your frontend
        res.redirect('/');

    } catch (err) {
        console.error(err);
        res
            .status(err.status || 500)
            .redirect('/login?error=' + encodeURIComponent(err.message));
    }
});

// HELPER
async function findOrCreateUser({ googleId, email, name, picture }) {
    const usersColl = db.collection('users');

    // 1) Try to find by googleId
    let user = await usersColl.findOne({ googleId: googleId });
    if (user) return user;

    // 2) If not found by googleId, try to find by email
    user = await usersColl.findOne({ email: email });

    // No auto link untill we have email verification when sign up through password
    // if (user) {
    //     // 2a) link their email to googleId
    //     await usersColl.updateOne(
    //         { _id: user._id },
    //         { $set: { googleId: googleId } }
    //     );
    //     // re-fetch so we return the full, updated document
    //     return await usersColl.findOne({ _id: user._id });
    // }

    if (user) {
        const err = new Error('Email is already registered with a password. Please sign in with your password and link google account.');
        err.status = 400;
        throw err;
    }

    // 3) No user at all, create a brand-new one
    const newUser = {
        googleId: googleId,
        email: email,
        name: name,
        picture: picture,
        createdAt: new Date()
    };
    const result = await usersColl.insertOne(newUser);
    newUser._id = result.insertedId;
    return newUser;
}

module.exports = router;
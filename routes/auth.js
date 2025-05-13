require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { OAuth2Client } = require('google-auth-library');
const authorizeUser = require('../middleware/authorizeUser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { verifyEmail } = require('../templates/emailTemplates');
const validator = require('validator');
const { error } = require('console');

const CLIENT_ID = process.env.GOOGLE_OATH2_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);

// Says this is a router, so use can use router.post(), router.get(), etc
const router = express.Router();

// Set up emailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});
// Verify emailer, for debugging
transporter.verify((err, success) => {
if (err) {
        console.error('SMTP config error', err);
    } else {
        console.log('SMTP server is ready to send messages');
    }
});

// Helper
function normalizeEmail(email) {
    return validator.normalizeEmail(email, {
        gmail_lowercase: true,
        gmail_remove_dots: true,
        gmail_remove_subaddress: true,
        gmail_convert_googlemaildotcom: true,
        outlookdotcom_lowercase: true,
        outlookdotcom_remove_subaddress: true,
        yahoo_lowercase: true,
        yahoo_remove_subaddress: true,
        icloud_lowercase: true,
        icloud_remove_subaddress: true
    });
}
  
// Helper
async function sendVerificationEmail(toEmail, token) {
    const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email`
                    + `?token=${token}`
                    + `&email=${encodeURIComponent(toEmail)}`;
    try {
        await transporter.sendMail({
            from: '"Chat 220" <touchgrassroyale@gmail.com>',
            to: toEmail,
            subject: 'Verify your Chat 220 email',
            html: verifyEmail(verifyUrl),
        });
    } catch (err) {
        console.error('Error sending verification email:', err);
        throw err;    // so your route knows it failed
      }
}

// router.get('/test-mail', async (req, res) => {
//     try {
//         await transporter.sendMail({
//             from: '"Chat 220" <touchgrassroyale@gmail.com>',
//             to: 'jampfer+test2@gmail.com',
//             subject: 'Test Email',
//             text: 'It works!!',
//         });
//         res.send('Sent');
//     } catch(err) {
//         console.error(err);
//         res.status(500).send('Fail');
//     }
// });

// GET api/auth/check-email
router.get('/check-email', async (req, res) => {
    const {email} = req.query;
    if (!email) {
        return res.status(400).json({error: 'Email is required'});
    }
    try {
        // check if existing email, don't let them do jam.pfer@gmail.com
        // Normalize email, remove +,. and uppercase
        const normalizedEmail = normalizeEmail(email);
        const usersCollection = db.collection('users');
        const existingUser = await usersCollection.findOne({normalizedEmail});

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
        // Normalize email, remove +,. and uppercase
        const normalizedEmail = normalizeEmail(email);
        const usersCollection = db.collection('users');

        //checking email in use
        const existingUser = await usersCollection.findOne({normalizedEmail});
        if (existingUser) {
            return res.status(400).json({error: 'Email is in use'});
        }

        //checking password length
        if (password.length < 7 || !/\d/.test(password)) {
            return res.status(400).json({error: 'Password must be longer than 7 characters and have a number'})
        }

        //checking email "validity" using a regular expression
        if (!validator.isEmail(email)) {
            return res.status(400).json({error: 'Email address is not a valid email'})
        }
        

        //hashing the password with bcrypt
        const hashedpass = await bcrypt.hash(password, 10);

        // Generate verification token and expiration
        const verifyToken = crypto.randomUUID();
        const verifyExpires = Date.now() + 60 * 60 * 1000 * 24; // 24 hours

        //adding user to database after checks
        await usersCollection.insertOne({ email, normalizedEmail, hashedpass, isVerified: false, verifyToken, verifyExpires, createdAt: new Date() });


        // Send verification email
        console.log(email);
        console.log(normalizedEmail);
        await sendVerificationEmail(email, verifyToken);
        res.status(201).json({success: 'User added to database. Check your email to verify.'});
    }
    catch (err) {
        res.status(500).json({ message: 'Error adding to database'});
    }

});


// GET api/auth/verify-email
router.get('/verify-email', async (req, res) => {
    const { token, email } = req.query;
    if (!token || !email) {
        return res.redirect(`${process.env.APP_URL}/login?verified=false&email=${encodeURIComponent(email)}`);
    }

    // Find them and verify them
    const result = await db.collection('users').updateOne(
        {
            email,
            verifyToken: token,
            verifyExpires: { $gt: Date.now() }
        },
        {
            $set: { isVerified: true },
            $unset: { verifyToken: "", verifyExpires: "" }
        }
    );

    // if no document was matched, the link was bad or expired
    if (result.matchedCount == 0) {
        return res.redirect(`${process.env.APP_URL}/login?verified=false&email=${encodeURIComponent(email)}`);
    }

    res.redirect(`${process.env.APP_URL}/login?verified=true`);
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;

    // Generate new values
    const verifyToken = crypto.randomUUID();
    const verifyExpires = Date.now() + 60 * 60 * 1000 * 24; // 24 hours

    const normalizedEmail = normalizeEmail(email);

    // Try to update the matching and unverified user
    const result = await db.collection('users').updateOne(
        { normalizedEmail, isVerified: false },
        { $set: { verifyToken, verifyExpires } }
    );

    // If nothing was updated, there was no matches, no pending verification
    if (result.matchedCount == 0) {
        return res.status(400).send('No pending verification.');
    }

    await sendVerificationEmail(email, verifyToken);
    res.send('Verification email resent.');
});


// POST api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Normalize email, remove +,. and uppercase
        const normalizedEmail = normalizeEmail(email);
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ normalizedEmail });

        if (!user) {
            return res.status(400).json({ error: 'Incorrect email or password' });
        }
        if (!user.isVerified) {
            return res.status(403).json({
                error: 'Please verify your email before loggin in.',
                needsVerification: true
            });
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
        const token = jwt.sign(
            { userId: user._id, iat: iat, exp: exp, picture: user.picture, name: user.name },
            process.env.JWT_SECRET
        );
        
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
            .redirect('/login?error=' + encodeURIComponent(err.message)
                                    + '&email=' + encodeURIComponent(payload.email)
            );
    }
});

// HELPER
async function findOrCreateUser({ googleId, email, name, picture }) {
    const usersColl = db.collection('users');

    // 1) Try to find by googleId
    let user = await usersColl.findOne({ googleId: googleId });
    if (user) return user;

    // 2) If not found by googleId, try to find by email
    // Normalize email, remove +,. and uppercase *find by normEmail*
    const normalizedEmail = normalizeEmail(email);
    user = await usersColl.findOne({ normalizedEmail });

    // 2a) No user at all, create a brand-new one!
    if (!user) {
        const newUser = {
            googleId: googleId,
            email: email,
            normalizedEmail: normalizedEmail,
            name: name,
            picture: picture,
            createdAt: new Date()
        };
        const result = await usersColl.insertOne(newUser);
        newUser._id = result.insertedId;
        return newUser;
    }

    // 2b) User exits, but not verified. No auto link untill we have email verification.
    if (!user.isVerified) {
        const err = new Error('Email is already registered with a password. Please verify your email to link your Google account.');
        err.status = 400;
        throw err;
    }

    // 3) User exists, Email is verified: link their email to googleId
    await usersColl.updateOne(
        { _id: user._id },
        { $set: { googleId, name, picture } }
    );
    // re-fetch so we return the full, updated document
    return await usersColl.findOne({ _id: user._id });
}

module.exports = router;
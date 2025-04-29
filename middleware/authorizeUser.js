const jwt = require('jsonwebtoken');

// Middleware to protect routes and authorize user based on JWT
function authorizeUser(req, res, next) {
    // Extract token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1]; // Format: "Bearer <token>"
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided, unauthorized' });
    }

    try {
        // Verify the token using the JWT secret stored in environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the decoded user info to the request object for access in subsequent handlers
        req.user.Id = decoded.userId;  // e.g., req.user.userId

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authorizeUser;

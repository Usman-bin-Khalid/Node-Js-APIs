const jwt = require('jsonwebtoken');
// Load JWT_SECRET from environment variables
const jwtSecret = process.env.JWT_SECRET; 

/**
 * Middleware to verify JWT from the Authorization header and attach user ID to the request.
 * * Assumes the token is sent in the format: 'Bearer <token>'
 */
const authMiddleware = (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 401 Unauthorized: token missing or badly formatted
        return res.status(401).json({ msg: 'Authorization denied. No token or incorrect format.' });
    }

    // Extract the token (remove 'Bearer ')
    const token = authHeader.split(' ')[1];
    

    // 2. Verify token
    try {
        // The token verification uses your JWT_SECRET from the .env file.
        // It decodes the payload, which should contain the user's ID.
        const decoded = jwt.verify(token, jwtSecret);

        // Assuming your token payload contains the user's ID under the key 'id'
        // Example: { id: 'actual_user_mongo_id', iat: ..., exp: ... }
        req.user = { id: decoded.id };

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // 401 Unauthorized: token is not valid (expired, corrupted, wrong secret)
        return res.status(401).json({ msg: 'Token is not valid or has expired.' });
    }
};

module.exports = authMiddleware;
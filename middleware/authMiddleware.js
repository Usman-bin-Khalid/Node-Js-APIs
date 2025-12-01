const jwt = require('jsonwebtoken');
// 🚨 NEW IMPORT: Import the User model
const User = require('../models/User'); // Adjust path as needed
const jwtSecret = process.env.JWT_SECRET; 

/**
 * Middleware to verify JWT and attach the FULL user document to the request.
 * Assumes the token is sent in the format: 'Bearer <token>'
 */
// 🚨 CHANGE TO ASYNC 🚨
const authMiddleware = async (req, res, next) => { 
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Authorization denied. No token or incorrect format.' });
    }

    // Extract the token (remove 'Bearer ')
    const token = authHeader.split(' ')[1];
    
    // 2. Verify token
    try {
        const decoded = jwt.verify(token, jwtSecret);

        // 🚨 CRITICAL CHANGE 🚨
        // Use the ID from the token (decoded.id) to fetch the User document from the database.
        // We exclude the password field for security.
        const user = await User.findById(decoded.id).select('-password'); 

        if (!user) {
            // If the user was deleted but the token is still valid
            return res.status(401).json({ msg: 'Token is valid, but user not found.' });
        }

        // 3. Attach the full Mongoose user document to req.user
        // This ensures req.user._id is populated correctly.
        req.user = user; 

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error(err); // Log the actual error on the server side
        return res.status(401).json({ msg: 'Token is not valid or has expired.' });
    }
};

module.exports = authMiddleware;
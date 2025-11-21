require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');

// Import the routes
const authRoutes = require('./routes/authRoutes');
// --- NEW: Import the profile routes ---
const profileRoutes = require('./routes/profileRoutes');

// Initialize the Express app
const app = express();

// --- 1. Middleware Setup ---
// Middleware to parse incoming JSON request bodies (for testing with JSON)
app.use(express.json());
// Middleware to parse incoming URL-encoded bodies (for testing with x-www-form-urlencoded and form-data)
app.use(express.urlencoded({ extended: true }));

// --- 2. Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

/**
 * Explanation on Database Name Creation:
 * The database name (e.g., 'authDB') is set in the MONGO_URI variable in the .env file.
 * MongoDB automatically creates the database and its collections (like 'users') 
 * the first time you execute a write operation (like saving a new user).
 * To use a database named 'test', change MONGO_URI in .env to: mongodb://localhost:27017/test
 */
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully!');
    } catch (err) {
        console.error('❌ MongoDB connection FAILED:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

// --- 3. Route Setup ---
// Basic Test Route
app.get('/', (req, res) => {
    res.send('API Status: Running. Use POST /api/auth/signup to register.');
});

// User Authentication Routes
// All routes defined in authRoutes will be prefixed with /api/auth
app.use('/api/auth', authRoutes);


// --- NEW: User Profile Routes ---
// All routes defined in profileRoutes will be prefixed with /api/profile
app.use('/api/profile', profileRoutes);


// --- 4. Start Server ---
// Connect to DB and then start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`➡️  Try the health check: http://localhost:${PORT}`);
        console.log(`➡️  Sign-up endpoint: http://localhost:${PORT}/api/auth/signup`);
        console.log(`➡️  Login endpoint: http://localhost:${PORT}/api/auth/login`);
    });
});
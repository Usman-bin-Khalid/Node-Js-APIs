require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');

// Import the routes
const authRoutes = require('./routes/authRoutes');

// Initialize the Express app
const app = express();

// --- 1. Middleware Setup ---
// Middleware to parse incoming JSON request bodies (VERY important for API)
// app.use(express.json());
app.use(express.urlencoded({ extended: true })); // x-www-urlencoded mai data send krny ky liy

// --- 2. Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

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


// --- 4. Start Server ---
// Connect to DB and then start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`➡️  Try the health check: http://localhost:${PORT}`);
        console.log(`➡️  Sign-up endpoint: http://localhost:${PORT}/api/auth/signup`);
    });
});
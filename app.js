// app.js

// 📦 External Dependencies
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Though not directly used here, keep it if used elsewhere
const path = require('path');
const cors = require('cors'); // ✅ CORS dependency

// Configuration
dotenv.config();

// 📂 Internal Models
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// 🚀 Initialize Express App
const app = express();

// 🌐 CORS Configuration (Allows all origins - Recommended for testing/public APIs)
app.use(cors({
    origin: "*", // Allows any domain to access the API
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
}));

// ⚙️ General Middlewares
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// 📄 Swagger Documentation Setup
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Node API Documentation',
            version: '1.0.0',
            description: 'API documentation for your Node.js backend',
        },
        servers: [
            {
                url: process.env.RENDER_URL || "http://localhost:5000", // Dynamic or fallback server URL
                description: "Live Server"
            }
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// 💾 Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => {
        console.error('❌ MongoDB connection FAILED:', err.message);
        // Exiting the process on connection failure is a good practice
        process.exit(1);
    });

// 🛣️ Route Imports
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const profileRoutes = require('./routes/profileRoutes');
const productRoutes = require('./routes/productRoutes');

// 🗺️ Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

// Welcome Route
app.get('/', (req, res) => {
    res.send('API Status: Running. Server is listening for REST and Socket connections.');
});


// 📡 SOCKET.IO Setup (Requires HTTP server)
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*", // Essential for Socket.IO to work with any client
        methods: ["GET", "POST"],
    },
});

// (Your Socket.IO connection logic goes here, e.g., io.on('connection', ...))

// ⚡ Start Server
// Use PORT provided by environment (e.g., Render) or default to 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
);